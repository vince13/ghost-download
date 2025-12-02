export const ghostScenarios = {
  sales: [
    { delay: 2000, payload: { type: 'transcript', text: 'Client: The pricing still feels steep.' } },
    { delay: 3200, payload: { type: 'alert', title: 'Objection', content: 'Price sensitivity' } },
    {
      delay: 4200,
      payload: { type: 'suggestion', text: "Ask: 'What would make this a no-brainer?'" }
    }
  ],
  interview: [
    {
      delay: 2200,
      payload: { type: 'transcript', text: 'Interviewer: Tell me about a time you disagreed with a manager.' }
    },
    {
      delay: 3600,
      payload: { type: 'suggestion', text: 'Use STAR. Highlight collaboration + resolution.' }
    }
  ],
  dating: [
    { delay: 2200, payload: { type: 'transcript', text: 'Date: I love spontaneous trips.' } },
    { delay: 3200, payload: { type: 'suggestion', text: 'Share your weekend getaway story.' } }
  ]
};

