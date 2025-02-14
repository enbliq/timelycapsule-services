/* eslint-disable @typescript-eslint/no-explicit-any */
export const notFoundMiddleware = (req: any, res: any) =>
  res.status(404).send('Not Found');
