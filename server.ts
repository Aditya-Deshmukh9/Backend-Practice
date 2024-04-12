import app from "./src/app";

const startServer = () => {
  const port = process.env.PORT || 8000;

  app.listen(port, () => {
    console.log("server listening on port " + port);
  });
};

startServer();
