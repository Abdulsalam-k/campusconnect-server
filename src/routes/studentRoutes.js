const express = require("express");

const User = require("../models/User");

const router = express.Router();

// =====================================================
// GET ALL STUDENTS
// =====================================================

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     description: Returns all active student profiles for the CampusConnect directory.
 *     tags:
 *       - Students
 *     responses:
 *       200:
 *         description: Students fetched successfully
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      isActive: true,
    })
      .select(
        "_id name email skills education department location bio profileImage createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const formattedStudents = students.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      skills: student.skills || [],
      education: student.education || "",
      department: student.department || "",
      location: student.location || "",
      bio: student.bio || "",
      profileImage: student.profileImage || "",
      createdAt: student.createdAt,
    }));

    return res.json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents,
    });
  } catch (error) {
    console.error(
      "Fetching students error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch students.",
    });
  }
});

// =====================================================
// GET SINGLE STUDENT
// =====================================================

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get a single student
 *     description: Returns the public profile of one active student by MongoDB ID.
 *     tags:
 *       - Students
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the student
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Student fetched successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const student =
      await User.findOne({
        _id: req.params.id,
        role: "student",
        isActive: true,
      })
        .select(
          "_id name email skills education department location bio profileImage createdAt"
        )
        .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found.",
      });
    }

    const formattedStudent = {
      id: student._id,
      name: student.name,
      email: student.email,
      skills: student.skills || [],
      education: student.education || "",
      department: student.department || "",
      location: student.location || "",
      bio: student.bio || "",
      profileImage:
        student.profileImage || "",
      createdAt: student.createdAt,
    };

    return res.json({
      success: true,
      data: formattedStudent,
    });
  } catch (error) {
    console.error(
      "Fetching student details error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch student.",
    });
  }
});

module.exports = router;