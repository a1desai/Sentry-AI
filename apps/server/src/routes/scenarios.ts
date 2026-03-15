import { Router } from 'express';
import { runInvestigation } from '../agent';
import { ScenarioName, SimulatorService } from '../services/simulator';

const router = Router();

router.post('/:name/replay', async (req, res) => {
  const { name } = req.params;
  
  try {
    if (name === 'complex_breach') {
      res.json({ success: true, message: 'Complex breach sequence initiated. Events will appear in dashboard shortly.' });
      
      const user = 'alice.assets@corp.com'; // Fixed user for correlation
      
      // Stage 1: Phishing
      const e1 = SimulatorService.generateEvent('phishing_email');
      e1.user = user;
      await runInvestigation(e1);
      
      // Stage 2: Login after 5s
      setTimeout(async () => {
        const e2 = SimulatorService.generateEvent('malicious_login');
        e2.user = user;
        await runInvestigation(e2);
        
        // Stage 3: Exfiltration after 5s
        setTimeout(async () => {
          const e3 = SimulatorService.generateEvent('data_exfiltration');
          e3.user = user;
          await runInvestigation(e3);
        }, 5000);
      }, 5000);
      
      return;
    }

    const event = SimulatorService.generateEvent(name as ScenarioName);
    const finalState = await runInvestigation(event) as any;

    res.json({
      success: true,
      message: `Scenario ${req.params.name} replayed with randomized event`,
      eventId: event.eventId,
      riskScore: finalState.risk_score,
      classification: finalState.risk_level,
      action: finalState.action
    });
  } catch (error: any) {
    console.error(`[SCENARIO ERROR] ${req.params.name}:`, error);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

export default router;
