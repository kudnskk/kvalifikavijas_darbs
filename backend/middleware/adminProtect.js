exports.adminOnly = async (req, res, next) => {
  try {
    const role = res.locals.user?.role;

    if (role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Only administrators can do this action",
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      status: false,
      message: "Only administrators can do this action",
      error: error.message,
    });
  }
};
