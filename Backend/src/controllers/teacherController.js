let teachers = [];

export const addTeacher = (req, res) => {
  const teacher = req.body;
  if (!teacher.name) {
    return res.status(400).json({ error: "Teacher name is required" });
  }

  teachers.push(teacher);
  res.json({ message: "Teacher added successfully", teachers });
};

export const getTeachers = (req, res) => {
  res.json(teachers);
};
