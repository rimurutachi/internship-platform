"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInternship = createInternship;
exports.getInternship = getInternship;
exports.getAllInternships = getAllInternships;
exports.updateInternship = updateInternship;
exports.deleteInternship = deleteInternship;
exports.getMyInternships = getMyInternships;
const internshipService_1 = require("../services/internshipService");
const internshipService = new internshipService_1.InternshipService();
async function createInternship(req, res) {
    try {
        const internship = await internshipService.create(req.body);
        res.status(201).json({ success: true, data: internship });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
async function getInternship(req, res) {
    try {
        const internship = await internshipService.getById(req.params.id);
        if (!internship) {
            return res.status(404).json({ success: false, error: 'Internship not found.' });
        }
        res.json({ success: true, data: internship });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
async function getAllInternships(req, res) {
    try {
        const internships = await internshipService.getAll(req.query);
        res.json({ success: true, data: internships, count: internships.length });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
async function updateInternship(req, res) {
    try {
        const internship = await internshipService.update(req.params.id, req.body);
        res.json({ success: true, data: internship });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
async function deleteInternship(req, res) {
    try {
        await internshipService.delete(req.params.id);
        res.json({ success: true, message: 'Internship deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
async function getMyInternships(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        let internships;
        if (userRole === 'student') {
            internships = await internshipService.getStudentInternships(userId);
        }
        else if (userRole === 'advisor') {
            internships = await internshipService.getAdvisorInternships(userId);
        }
        else if (userRole === 'supervisor') {
            internships = await internshipService.getSupervisorInternships(userId);
        }
        else {
            return res.status(403).json({ success: false, error: 'Unauthorized role' });
        }
        res.json({ success: true, data: internships });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
//# sourceMappingURL=internshipController.js.map