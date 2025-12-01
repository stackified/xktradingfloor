const CourseModel = require("../models/course.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex } = require("../utils/fn");

// Create course / freebie
exports.createCourse = async (req, res) => {
    try {
        const course = new CourseModel(req.body);
        const saved = await course.save();
        const c = saved.toObject();
        c.id = c._id.toString();
        return sendSuccessResponse(res, { message: "Course created", data: c }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get all courses / freebies
exports.getAllCourses = async (req, res) => {
    try {
        const { search, page, size } = req.query;
        const { limit, offset } = getPagination(page, size);
        const searchTerm = escapeRegex(search);

        const query = {};
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
            ];
        }

        const courses = await CourseModel.find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        const totalItems = await CourseModel.countDocuments(query);

        const transformed = courses.map((course) => {
            const c = course.toObject();
            c.id = c._id.toString();
            return c;
        });

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: transformed }, page, limit)
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return sendErrorResponse(res, "Course not found", 404, true, true);
        }
        const c = course.toObject();
        c.id = c._id.toString();
        return sendSuccessResponse(res, { data: c });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Update course
exports.updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return sendErrorResponse(res, "Course not found", 404, true, true);
        }
        Object.assign(course, req.body);
        const updated = await course.save();
        const c = updated.toObject();
        c.id = c._id.toString();
        return sendSuccessResponse(res, { message: "Course updated", data: c });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Delete course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await CourseModel.findByIdAndDelete(courseId);
        if (!course) {
            return sendErrorResponse(res, "Course not found", 404, true, true);
        }
        return sendSuccessResponse(res, { message: "Course deleted" });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};



