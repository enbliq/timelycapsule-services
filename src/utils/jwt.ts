import jwt from "jsonwebtoken";

const generateAccessToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }  // 15 minutes token expiry
  );
};

export { generateAccessToken };
