import { Slider } from './Slider.jsx';
import { Modal } from './Modal.jsx';
import { Badge, Button } from './ui.jsx';

const latencyMarks = [
  { value: 250, label: '250ms' },
  { value: 500, label: '500ms' },
  { value: 750, label: '750ms' }
];

export const ParametersModal = ({ isOpen, onClose, settings, onChange }) => {
  const updateSetting = (patch) => onChange({ ...settings, ...patch });

  const toggleTrigger = (key) => {
    updateSetting({
      triggers: {
        ...settings.triggers,
        [key]: !settings.triggers[key]
      }
    });
  };

  return (
    <Modal
      title="Realtime Parameters"
      description="Tune how aggressive Ghost should be during live calls."
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between">
          <Badge color="yellow">Beta</Badge>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Latency Target</p>
            <p className="text-xs text-gray-500">Lower latency uses more API credits.</p>
          </div>
          <span className="text-sm text-blue-300">{settings.latencyTarget} ms</span>
        </div>
        <Slider
          min={200}
          max={800}
          step={50}
          value={settings.latencyTarget}
          onChange={(value) => updateSetting({ latencyTarget: value })}
          marks={latencyMarks}
        />
      </section>

      <section className="space-y-3">
        <p className="font-semibold text-white">Trigger Keywords</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(settings.triggers).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleTrigger(key)}
              className={`p-3 rounded-xl border transition-colors text-left ${
                value ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-800 bg-gray-900 text-gray-300'
              }`}
            >
              <p className="font-medium capitalize">{key}</p>
              <p className="text-xs text-gray-400">Monitor {key} mentions</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="font-semibold text-white">Voice Persona</p>
        <div className="grid grid-cols-3 gap-2">
          {['Calm', 'Assertive', 'Playful'].map((persona) => (
            <button
              key={persona}
              type="button"
              onClick={() => updateSetting({ persona })}
              className={`px-3 py-2 rounded-lg border text-sm ${
                settings.persona === persona
                  ? 'border-green-500 bg-green-500/10 text-white'
                  : 'border-gray-800 text-gray-400'
              }`}
            >
              {persona}
            </button>
          ))}
        </div>
      </section>
    </Modal>
  );
};

