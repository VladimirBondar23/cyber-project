import express from 'express';
import { pool, initDb } from './db';
import firewallRouter from "./routes/firewall";

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

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});


