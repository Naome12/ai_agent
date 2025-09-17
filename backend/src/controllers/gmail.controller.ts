import { Request, Response } from "express";
import { GmailAgentService } from "../services/gmail.service";

const gmailAgent = new GmailAgentService();

/**
 * @desc Run Gmail agent with natural language input
 */
export const runGmailAgentCtrl = async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ message: "Input is required" });
    }

    const result = await gmailAgent.invoke(input);
    
    // Properly handle success/failure based on the result
    if (result.success) {
      res.json({ success: true, output: result.output });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        message: "Gmail agent execution failed" 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
