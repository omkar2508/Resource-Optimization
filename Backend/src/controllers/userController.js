import userModel from "../models/userModel.js";
export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await userModel.findById(userId).select(
      "name email role isAccountVerified department admissionYear division batch"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      userData: {
        name: user.name,
        email: user.email,
        role: user.role,
        isAccountVerified: user.isAccountVerified,

        // academic info
        department: user.department,
        admissionYear: user.admissionYear,
        division: user.division,
        batch: user.batch,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const updateStudentProfile = async (req, res) => {
  const { batch } = req.body;
  const userId = req.userId;

  if (!batch) {
    return res.status(400).json({
      success: false,
      message: "Lab batch is required",
    });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    user.batch = batch;
    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
