import { ghostScenarios } from '../src/data/ghost-scenarios.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  const mode = req.query?.mode ?? 'sales';

  const events = ghostScenarios[mode] ?? ghostScenarios.sales;

  for (const event of events) {
    await new Promise((resolve) => setTimeout(resolve, event.delay));
    res.write(`${JSON.stringify(event.payload)}\n`);
  }

  res.end();
}

