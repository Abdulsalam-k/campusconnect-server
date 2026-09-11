const express = require("express");

const mongoose = require("mongoose");

const Application = require("../models/Application");

const Opportunity = require("../models/Opportunity");

const Notification = require("../models/Notification");

const User = require("../models/User");

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const {
  sendEmail,
} = require("../utils/sendEmail");

const router = express.Router();

// =====================================================
// INPUT HELPERS
// =====================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isValidPhone(phone) {
  return /^[0-9+\-()\s]{7,20}$/.test(
    phone
  );
}

// =====================================================
// SUBMIT APPLICATION
// STUDENT ONLY
// =====================================================

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Submit an application
 *     description: Allows an authenticated student to apply for an opportunity.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - opportunityId
 *               - fullName
 *               - email
 *               - phone
 *               - coverLetter
 *             properties:
 *               opportunityId:
 *                 type: string
 *                 description: MongoDB ID of the opportunity
 *                 example: 507f1f77bcf86cd799439011
 *               fullName:
 *                 type: string
 *                 example: Abdulkareem Abdulsalam
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               phone:
 *                 type: string
 *                 example: +2348012345678
 *               coverLetter:
 *                 type: string
 *                 example: I am interested in this opportunity because I have relevant frontend development experience.
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid or missing application data
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Only students can submit applications
 *       404:
 *         description: Opportunity not found
 *       409:
 *         description: Student has already applied for this opportunity
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const {
        opportunityId,
        fullName,
        email,
        phone,
        coverLetter,
      } = req.body || {};

      // ==========================================
      // REQUIRED FIELD VALIDATION
      // ==========================================

      if (
        !opportunityId ||
        !fullName ||
        !email ||
        !phone ||
        !coverLetter
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All application fields are required.",
        });
      }

      // ==========================================
      // OPPORTUNITY ID VALIDATION
      // ==========================================

      if (
        !mongoose.isValidObjectId(
          opportunityId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid opportunity ID.",
        });
      }

      // ==========================================
      // NORMALIZE INPUT
      // ==========================================

      const normalizedName =
        String(fullName).trim();

      const normalizedEmail =
        String(email)
          .toLowerCase()
          .trim();

      const normalizedPhone =
        String(phone).trim();

      const normalizedCoverLetter =
        String(coverLetter).trim();

      // ==========================================
      // LENGTH VALIDATION
      // ==========================================

      if (
        normalizedName.length < 2 ||
        normalizedName.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name must be between 2 and 100 characters.",
        });
      }

      if (
        normalizedEmail.length > 254 ||
        !isValidEmail(normalizedEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid email address.",
        });
      }

      if (
        normalizedPhone.length < 7 ||
        normalizedPhone.length > 20 ||
        !isValidPhone(normalizedPhone)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid phone number.",
        });
      }

      if (
        normalizedCoverLetter.length < 10 ||
        normalizedCoverLetter.length > 5000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cover letter must be between 10 and 5000 characters.",
        });
      }

      // ==========================================
      // CHECK OPPORTUNITY
      // ==========================================

      const opportunity =
        await Opportunity.findById(
          opportunityId
        );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "Opportunity not found.",
        });
      }

      // ==========================================
      // PREVENT DUPLICATE APPLICATION
      // ==========================================

      const existingApplication =
        await Application.findOne({
          userId: req.user.userId,
          opportunityId:
            opportunity._id,
        });

      if (existingApplication) {
        return res.status(409).json({
          success: false,
          message:
            "You have already applied for this opportunity.",
        });
      }

      // ==========================================
      // CREATE APPLICATION
      // ==========================================

      const application =
        await Application.create({
          userId: req.user.userId,
          opportunityId:
            opportunity._id,
          fullName: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          coverLetter:
            normalizedCoverLetter,
        });

      // =================================================
      // IN-APP NOTIFICATION FOR STUDENT
      // =================================================

      await Notification.create({
        userId: req.user.userId,
        title: "Application Submitted",
        message:
          `Your application for ${opportunity.title} at ` +
          `${opportunity.company} has been submitted successfully.`,
        type: "application",
      });

      // =================================================
      // IN-APP NOTIFICATION FOR OPPORTUNITY OWNER
      // =================================================

      if (opportunity.createdBy) {
        await Notification.create({
          userId:
            opportunity.createdBy,
          title: "New Application",
          message:
            `${normalizedName} has applied for your ` +
            `${opportunity.title} opportunity.`,
          type: "application",
        });
      }

      // =================================================
      // EMAIL TO RECRUITER
      // =================================================

      if (opportunity.createdBy) {
        const recruiter =
          await User.findById(
            opportunity.createdBy
          ).select("name email");

        if (recruiter?.email) {
          try {
            const safeRecruiterName =
              escapeHtml(
                recruiter.name ||
                  "Recruiter"
              );

            const safeOpportunityTitle =
              escapeHtml(
                opportunity.title
              );

            const safeCompany =
              escapeHtml(
                opportunity.company
              );

            const safeApplicantName =
              escapeHtml(
                normalizedName
              );

            const safeApplicantEmail =
              escapeHtml(
                normalizedEmail
              );

            const safePhone =
              escapeHtml(
                normalizedPhone
              );

            await sendEmail({
              to: recruiter.email,

              subject:
                `New application for ${opportunity.title}`,

              text: `
Hello ${recruiter.name || "Recruiter"},

You have received a new application on CampusConnect.

Opportunity:

${opportunity.title}

Company:

${opportunity.company}

Applicant:

${normalizedName}

Applicant email:

${normalizedEmail}

Phone:

${normalizedPhone}

The applicant has successfully submitted their application.

Log in to CampusConnect to review the application.

CampusConnect
`.trim(),

              html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>New CampusConnect application</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f1f5f9;
    font-family: Arial, Helvetica, sans-serif;
  "
>
  <div
    style="
      max-width: 620px;
      margin: 40px auto;
      padding: 20px;
    "
  >
    <div
      style="
        background: #ffffff;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      "
    >
      <div
        style="
          background: #0f172a;
          padding: 28px 30px;
          text-align: center;
        "
      >
        <div
          style="
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
          "
        >
          Campus<span
            style="color: #60a5fa;"
          >
            Connect
          </span>
        </div>
      </div>

      <div style="padding: 35px 30px;">
        <h1
          style="
            margin: 0 0 14px;
            color: #0f172a;
            font-size: 25px;
          "
        >
          New application received
        </h1>

        <p
          style="
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Hello ${safeRecruiterName},
        </p>

        <p
          style="
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          A student has applied for your
          opportunity on CampusConnect.
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 18px;
            background: #eff6ff;
            border-radius: 12px;
            border: 1px solid #bfdbfe;
          "
        >
          <p
            style="
              margin: 0 0 8px;
              color: #64748b;
              font-size: 13px;
            "
          >
            Opportunity
          </p>

          <strong
            style="
              color: #1e3a8a;
              font-size: 17px;
            "
          >
            ${safeOpportunityTitle}
          </strong>

          <p
            style="
              margin: 6px 0 0;
              color: #475569;
              font-size: 14px;
            "
          >
            ${safeCompany}
          </p>
        </div>

        <div
          style="
            margin: 24px 0;
            padding: 18px;
            background: #f8fafc;
            border-radius: 12px;
          "
        >
          <p
            style="
              margin: 0 0 10px;
              color: #64748b;
              font-size: 13px;
            "
          >
            Applicant
          </p>

          <p
            style="
              margin: 0 0 6px;
              color: #0f172a;
              font-size: 15px;
              font-weight: 700;
            "
          >
            ${safeApplicantName}
          </p>

          <p
            style="
              margin: 0 0 6px;
              color: #475569;
              font-size: 14px;
            "
          >
            ${safeApplicantEmail}
          </p>

          <p
            style="
              margin: 0;
              color: #475569;
              font-size: 14px;
            "
          >
            ${safePhone}
          </p>
        </div>

        <p
          style="
            color: #475569;
            font-size: 14px;
            line-height: 1.7;
          "
        >
          Log in to CampusConnect to review
          the applicant and manage the application.
        </p>

        <div
          style="
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          "
        >
          <p
            style="
              margin: 0;
              color: #94a3b8;
              font-size: 12px;
            "
          >
            CampusConnect — Student opportunities,
            talent and connections.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`.trim(),
            });
          } catch (emailError) {
            // Email failure must not cancel
            // successful application submission.

            console.error(
              "Recruiter application email failed:",
              emailError.message
            );
          }
        }
      }

      // =================================================
      // RETURN APPLICATION
      // =================================================

      await application.populate(
        "opportunityId",
        "title company location type mode category deadline"
      );

      return res.status(201).json({
        success: true,
        message:
          "Application submitted successfully.",
        data: application,
      });
    } catch (error) {
      console.error(
        "Application submission error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit application.",
      });
    }
  }
);

// =====================================================
// UPDATE APPLICATION STATUS
// RECRUITER / ADMIN
// =====================================================

/**
 * @swagger
 * /api/applications/{id}/status:
 *   put:
 *     summary: Update application status
 *     description: Allows a recruiter to accept or reject an application for their own opportunity. Administrators can manage any application.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the application
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - Accepted
 *                   - Rejected
 *                 example: Accepted
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       400:
 *         description: Invalid application ID, invalid status, or application already processed
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: User is not authorized to manage this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/status",
  protect,
  authorizeRoles("recruiter", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { status } =
        req.body || {};

      // ==========================================
      // VALIDATE APPLICATION ID
      // ==========================================

      if (
        !mongoose.isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application ID.",
        });
      }

      // ==========================================
      // VALIDATE STATUS
      // ==========================================

      if (
        !["Accepted", "Rejected"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be either Accepted or Rejected.",
        });
      }

      // ==========================================
      // FIND APPLICATION
      // ==========================================

      const application =
        await Application.findById(id)
          .populate(
            "opportunityId",
            "title company createdBy"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found.",
        });
      }

      // ==========================================
      // ADMIN CAN MANAGE ALL APPLICATIONS
      // ==========================================

      const isAdmin =
        req.user.role === "admin";

      // ==========================================
      // RECRUITER MUST OWN OPPORTUNITY
      // ==========================================

      const isOpportunityOwner =
        application.opportunityId
          ?.createdBy &&
        application.opportunityId.createdBy
          .toString() ===
          req.user.userId.toString();

      if (
        !isAdmin &&
        !isOpportunityOwner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage applications for opportunities you created.",
        });
      }

      // ==========================================
      // PREVENT REPROCESSING
      // ==========================================

      if (
        application.status !==
        "Pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `This application has already been ${application.status.toLowerCase()}.`,
        });
      }

      // ==========================================
      // UPDATE STATUS
      // ==========================================

      application.status = status;

      await application.save();

      // =================================================
      // IN-APP NOTIFICATION FOR STUDENT
      // =================================================

      await Notification.create({
        userId: application.userId,
        title: `Application ${status}`,
        message:
          `Your application for ${application.opportunityId.title} ` +
          `at ${application.opportunityId.company} has been ` +
          `${status.toLowerCase()}.`,
        type: "application",
      });

      // =================================================
      // EMAIL TO STUDENT
      // =================================================

      const student =
        await User.findById(
          application.userId
        ).select("name email");

      if (student?.email) {
        const isAccepted =
          status === "Accepted";

        try {
          const safeStudentName =
            escapeHtml(
              student.name || "Student"
            );

          const safeOpportunityTitle =
            escapeHtml(
              application.opportunityId.title
            );

          const safeCompany =
            escapeHtml(
              application.opportunityId.company
            );

          await sendEmail({
            to: student.email,

            subject:
              `Application ${status}: ${application.opportunityId.title}`,

            text: `
Hello ${student.name || "Student"},

Your CampusConnect application has been ${status.toLowerCase()}.

Opportunity:

${application.opportunityId.title}

Company:

${application.opportunityId.company}

Status:

${status}

${
  isAccepted
    ? "Congratulations! The recruiter has accepted your application."
    : "Thank you for your interest. We encourage you to continue exploring opportunities on CampusConnect."
}

Please log in to CampusConnect for more details.

CampusConnect
`.trim(),

            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Application ${status}</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f1f5f9;
    font-family: Arial, Helvetica, sans-serif;
  "
>
  <div
    style="
      max-width: 620px;
      margin: 40px auto;
      padding: 20px;
    "
  >
    <div
      style="
        background: #ffffff;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      "
    >
      <div
        style="
          background: #0f172a;
          padding: 28px 30px;
          text-align: center;
        "
      >
        <div
          style="
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
          "
        >
          Campus<span
            style="color: #60a5fa;"
          >
            Connect
          </span>
        </div>
      </div>

      <div style="padding: 35px 30px;">
        <h1
          style="
            margin: 0 0 14px;
            color: #0f172a;
            font-size: 25px;
          "
        >
          Application ${status}
        </h1>

        <p
          style="
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Hello ${safeStudentName},
        </p>

        <p
          style="
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Your application status has been updated.
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 20px;
            background: ${
              isAccepted
                ? "#ecfdf5"
                : "#fef2f2"
            };
            border-radius: 12px;
            border: 1px solid ${
              isAccepted
                ? "#a7f3d0"
                : "#fecaca"
            };
          "
        >
          <p
            style="
              margin: 0 0 8px;
              color: #64748b;
              font-size: 13px;
            "
          >
            Opportunity
          </p>

          <strong
            style="
              display: block;
              margin-bottom: 8px;
              color: #0f172a;
              font-size: 17px;
            "
          >
            ${safeOpportunityTitle}
          </strong>

          <p
            style="
              margin: 0 0 14px;
              color: #475569;
              font-size: 14px;
            "
          >
            ${safeCompany}
          </p>

          <strong
            style="
              color: ${
                isAccepted
                  ? "#047857"
                  : "#b91c1c"
              };
              font-size: 16px;
            "
          >
            Status: ${status}
          </strong>
        </div>

        <p
          style="
            color: #475569;
            font-size: 14px;
            line-height: 1.7;
          "
        >
          ${
            isAccepted
              ? "Congratulations! The recruiter has accepted your application."
              : "Thank you for your interest. We encourage you to continue exploring other opportunities on CampusConnect."
          }
        </p>

        <div
          style="
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          "
        >
          <p
            style="
              margin: 0;
              color: #94a3b8;
              font-size: 12px;
            "
          >
            CampusConnect — Student opportunities,
            talent and connections.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`.trim(),
          });
        } catch (emailError) {
          // Do not undo the application
          // status if email fails.

          console.error(
            "Application status email failed:",
            emailError.message
          );
        }
      }

      return res.json({
        success: true,
        message:
          `Application ${status.toLowerCase()} successfully.`,
        data: application,
      });
    } catch (error) {
      console.error(
        "Updating application status error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update application status.",
      });
    }
  }
);

// =====================================================
// GET MY APPLICATIONS
// STUDENT
// =====================================================

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: Get the authenticated student's applications
 *     description: Returns all applications submitted by the currently authenticated student.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications fetched successfully
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Only students can access their applications
 *       500:
 *         description: Server error
 */
router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const applications =
        await Application.find({
          userId: req.user.userId,
        })
          .populate(
            "opportunityId",
            "title company location type mode category deadline"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: applications.length,
        data: applications,
      });
    } catch (error) {
      console.error(
        "Fetching my applications error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch your applications.",
      });
    }
  }
);

// =====================================================
// GET ALL APPLICATIONS
// ADMIN ONLY
// =====================================================

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications
 *     description: Returns all applications in the system. This endpoint is restricted to administrators.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications fetched successfully
 *       401:
 *         description: Missing or invalid authentication token
 *       403:
 *         description: Only administrators can access all applications
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const applications =
        await Application.find()
          .populate(
            "userId",
            "name email role"
          )
          .populate(
            "opportunityId",
            "title company location type mode category deadline createdBy"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: applications.length,
        data: applications,
      });
    } catch (error) {
      console.error(
        "Fetching applications error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch applications.",
      });
    }
  }
);

module.exports = router;