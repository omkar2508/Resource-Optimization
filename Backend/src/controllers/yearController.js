let yearConfig = {};

export const saveYearConfig = (req, res) => {
  yearConfig = req.body;

  if (!yearConfig || Object.keys(yearConfig).length === 0) {
    return res.status(400).json({ error: "Invalid year configuration" });
  }

  res.json({ message: "Year configuration saved", yearConfig });
};

export const getYearConfig = (req, res) => {
  res.json(yearConfig);
};
