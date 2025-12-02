import { useEffect, useMemo, useRef, useState } from 'react';

const BASE_SCENARIOS = {
  sales: [
    {
      trigger: 2500,
      type: 'transcript',
      text: 'Client: To be honest, the price feels high for us right now.'
    },
    {
      trigger: 3600,
      type: 'alert',
      title: 'Objection Detected',
      content: 'Price Sensitivity',
      action: 'Pivot to Value',
      color: 'red'
    },
    {
      trigger: 4500,
      type: 'suggestion',
      text: "Ask: 'Aside from price, what else is holding you back?'"
    }
  ],
  interview: [
    {
      trigger: 2500,
      type: 'transcript',
      text: 'Interviewer: Can you describe a time you failed?'
    },
    {
      trigger: 3200,
      type: 'alert',
      title: 'Trap Question',
      content: 'Behavioral Check',
      action: 'Use STAR method',
      color: 'yellow'
    },
    {
      trigger: 4200,
      type: 'suggestion',
      text: 'Situation → Task → Action → Result. Focus on learning.'
    }
  ],
  dating: [
    {
      trigger: 2200,
      type: 'transcript',
      text: 'Date: I really love hiking and the outdoors.'
    },
    {
      trigger: 3200,
      type: 'suggestion',
      text: 'Mention your Alps trip. Skip the MMO storyline.'
    }
  ]
};

export const useScenarioEngine = (mode, isActive) => {
  const [transcript, setTranscript] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const timeoutsRef = useRef([]);

  const scenarios = useMemo(() => BASE_SCENARIOS[mode] ?? BASE_SCENARIOS.sales, [mode]);

  useEffect(() => {
    if (!isActive) return;

    timeoutsRef.current = scenarios.map((event) =>
      setTimeout(() => {
        if (event.type === 'transcript') {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: 'Them',
              text: event.text,
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            }
          ]);
        } else {
          setSuggestions((prev) => [event, ...prev]);
        }
      }, event.trigger)
    );

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [isActive, scenarios]);

  const addSystemMessage = (text) => {
    setTranscript((prev) => [
      ...prev,
      {
        speaker: 'System',
        text,
        isSystem: true,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
    ]);
  };

  const reset = () => {
    setTranscript([]);
    setSuggestions([]);
  };

  return { transcript, suggestions, addSystemMessage, reset };
};

