import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"; // ✅ Correct URL

app.post("/", async (req, res) => {
    let userInput = req.body;
    console.log(userInput);
    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `
                    Your goal is to guide them step-by-step toward clarity about their career goals.
                    - Start with **broad** open-ended questions.
                    - Based on their response, gradually **narrow the focus**.
                    - Keep track of what they mention and **refer back to previous answers**.
                    - Ensure the conversation feels natural, like a real human dialogue.
                    - Ask one question at a time, leading them toward defining their career path.

                    **Examples of conversation flow:**
                    - AI: "What excites you about the future?"
                    - User: "I enjoy technology."
                    - AI: "Interesting! Are you
                        `
                    },
                    {
                        role: "user",
                        content: JSON.stringify(userInput)
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ prompt: data.choices[0].message.content });
        } else {
            console.error("Error response from Groq API:", data);
            res.status(500).json({ error: data.error || "Unknown error from Groq API." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error generating aspiration prompt." });
    }
});
// ✅ Generate a Quiz Based on User Aspiration
app.post("/generate_quiz", async (req, res) => {
    try {
        const { userAspiration } = req.body;

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `
                            You are an AI that generates a short multiple-choice quiz to assess a user's knowledge level.
                            The quiz should have 3-5 questions, each with 4 answer choices, only one of which is correct.
                            Format your response as valid JSON:
                            {
                                "quiz": [
                                    {
                                        "question": "What is X?",
                                        "choices": ["Option A", "Option B", "Option C", "Option D"],
                                        "correct_answer": "Option B"
                                    }
                                ]
                            }
                        `
                    },
                    {
                        role: "user",
                        content: `Create a quiz to assess the skill level of someone interested in ${userAspiration}.`
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ quiz: JSON.parse(data.choices[0].message.content) });
        } else {
            console.error("Error response from Groq API:", data);
            res.status(500).json({ error: data.error || "Unknown error from Groq API." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error generating quiz." });
    }
});

// ✅ Generate Learning Milestones Based on Quiz Answers
app.post("/generate_milestones", async (req, res) => {
    try {
        const { userAspiration, quizAnswers } = req.body;

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `
                            You are an AI guide that determines a user's skill level based on quiz answers.
                            Then, generate a structured learning path tailored to their level.
                            The response must be valid JSON:
                            {
                                "user_level": "Beginner | Intermediate | Advanced",
                                "summary": "A brief summary of the suggested learning path.",
                                "learning_path": [
                                    {
                                        "step": 1,
                                        "title": "Step Title",
                                        "description": "Step Description",
                                        "resources": [
                                            {
                                                "type": "Article | Course | Video",
                                                "title": "Resource Title",
                                                "url": "https://example.com"
                                            }
                                        ]
                                    }
                                ],
                                "next_steps": "Guidance on what the user should do next."
                            }
                        `
                    },
                    {
                        role: "user",
                        content: `
                            Based on these quiz answers: ${JSON.stringify(quizAnswers)},
                            determine the user's level (Beginner, Intermediate, or Advanced).
                            Then, generate a learning path for someone interested in ${userAspiration}.
                        `
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (response.ok) {
            let milestones = JSON.parse(data.choices[0].message.content)
            res.json({ prompt: milestones });
        } else {
            console.error("Error response from Groq API:", data);
            res.status(500).json({ error: data.error || "Unknown error from Groq API." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error generating milestones." });
    }
});

// ✅ Comparative Analysis - Tracks User Progress Towards a Larger Goal
app.post("/compare_progress", async (req, res) => {
    try {
        const { userLevel, userAspiration } = req.body;

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: `
                            You are an AI that performs a comparative analysis of a user's current progress.
                            Compare their standing to an even larger goal (e.g., reaching Intermediate from Beginner).
                            Provide insights on their gaps, what they have achieved, and what remains.
                            Format your response as valid JSON:
                            {
                                "current_level": "Beginner | Intermediate | Advanced",
                                "target_level": "Intermediate | Advanced",
                                "progress_summary": "What the user has accomplished so far.",
                                "remaining_steps": "What they need to achieve next.",
                                "challenges": "Potential difficulties they might face.",
                                "recommended_actions": "Suggested tasks to help bridge the gap."
                            }
                        `
                    },
                    {
                        role: "user",
                        content: `Analyze my current level (${userLevel}) in relation to achieving ${userAspiration}. Give me a comparison to the next big milestone.`
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ progress_comparison: JSON.parse(data.choices[0].message.content) });
        } else {
            console.error("Error response from Groq API:", data);
            res.status(500).json({ error: data.error || "Unknown error from Groq API." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error comparing progress." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
