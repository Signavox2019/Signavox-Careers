const Application = require('../models/Application');

// ✅ Get Upcoming Events (User-specific)
exports.getUpcomingEvents = async (req, res) => {
  try {
    // Get applications only for the logged-in user
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title')
      .populate('candidate', 'firstName lastName email');

    console.log('Applications found for user:', applications.length);

    const upcomingEvents = [];

    for (const app of applications) {
      console.log('Stage data for app', app._id, app.stageWiseStatus);

      const stages = [
        'resume_shortlisted',
        'group_discussion',
        'screening_test',
        'technical_interview',
        'manager_interview',
        'hr_interview',
        'offered',
        'hired'
      ];

      const stageStatuses = app.stageWiseStatus || [];

      // Find the next pending stage after completed ones
      const nextStage = stages
        .map(stage => stageStatuses.find(s => s.stageName === stage && s.status === 'pending'))
        .find(Boolean);

      if (nextStage) {
        upcomingEvents.push({
          applicationId: app._id,
          jobTitle: app.job?.title,
          stageName: nextStage.stageName,
          stageStatus: nextStage.status,
          candidate: app.candidate
            ? app.candidate.firstName + ' ' + app.candidate.lastName
            : null,
          updatedAt: nextStage.updatedAt,
          appliedAt: app.appliedAt
        });
      }
    }

    res.json({
      message: 'Upcoming events fetched successfully.',
      count: upcomingEvents.length,
      events: upcomingEvents
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Server error while fetching upcoming events' });
  }
};
