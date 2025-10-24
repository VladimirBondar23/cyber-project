import "./logging/Logger"
import express from 'express';
import { initDb } from './db/db';
import firewallRouter from "./routes/firewall";
import { config } from "./env";
const app = express();
app.use(express.json());

initDb().catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});

app.use("/api/firewall", firewallRouter);
app.get('/', (req, res) => {
  res.send('Hello World!');
});

if (process.env.NODE_ENV !== "test") {
  app.listen(config.PORT, () => {
    console.log(`Server is running on http://localhost:${config.PORT}`);
  });
}

export default app;
