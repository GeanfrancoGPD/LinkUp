import app from "./utils/middleware.js";
import LinkRouter from "./module/LinkRouter.js";

app.use("/api/link", LinkRouter);

const port: number = Number(process.env.PORT) || 5000;

// --- START ---
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor ejecutandose en el puerto ${port}`);
});
