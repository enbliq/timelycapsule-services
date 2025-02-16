import jwt from 'jsonwebtoken';

export const verifyToken = (req: any, res: any, next: any) => {
	const token = req.cookies.token;
	if (!token) return res.status(401).json({ success: false, message: "Unauthorized - no token provided" });
	try {
		const secret = process.env.JWT_SECRET;
		if (!secret) return res.status(500).json({ success: false, message: "Server error - missing JWT secret" });
		const decoded = jwt.verify(token, secret);

		if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized - invalid token" });

		req.userId = (decoded as jwt.JwtPayload).userId;
		next();
	} catch (error) {
		console.log("Error in verifyToken ", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};
