import { Button } from '@/components/ui/button'
import { PROVIDER_CONFIGS } from '@/types/poker'
import { useSettingsStore } from '@/stores/settingsStore'

import { KeyBindingEditor } from './KeyBindingEditor'

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark (recommended)' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const

const KEY_BINDING_CONFIG = [
  { action: 'fold' as const, label: 'Fold' },
  { action: 'call' as const, label: 'Call' },
  { action: 'raise' as const, label: 'Raise' },
  { action: 'allin' as const, label: 'All-in' },
  { action: 'next' as const, label: 'Next hand' },
]

export function SettingsPage() {
  const settings = useSettingsStore()

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-lg mx-auto w-full py-4">
      <h2 className="font-display text-2xl font-bold text-brass">Settings</h2>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={settings.theme === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => settings.setTheme(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </Section>

      {/* Keyboard Shortcuts */}
      <Section title="Keyboard Shortcuts" description="Click a key to rebind it. Press any key to set the new binding.">
        <div className="divide-y divide-border">
          {KEY_BINDING_CONFIG.map(({ action, label }) => (
            <KeyBindingEditor
              key={action}
              action={action}
              label={label}
              currentKey={settings.keyBindings[action]}
              onKeyChange={(key) => settings.setKeyBinding(action, key)}
            />
          ))}
        </div>
      </Section>

      {/* Training Difficulty */}
      <Section
        title="Training Difficulty"
        description="Higher values require faster, more consistent answers before marking a hand as mastered."
      >
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={settings.trainingStrictness}
            onChange={(e) => settings.setTrainingStrictness(Number(e.target.value))}
            className="flex-1 accent-brass"
          />
          <span className="text-sm font-medium text-foreground tabular-nums w-8 text-center">
            {settings.trainingStrictness}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Lenient</span>
          <span>Strict</span>
        </div>
      </Section>

      {/* Sound */}
      <Section title="Sound">
        <Button
          variant={settings.soundEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => settings.setSoundEnabled(!settings.soundEnabled)}
        >
          {settings.soundEnabled ? 'On' : 'Off'}
        </Button>
      </Section>

      {/* Default Chart Pack */}
      <Section title="Default Chart Pack" description="Which chart pack to load when you start training.">
        <div className="flex flex-wrap gap-2">
          {PROVIDER_CONFIGS.map((config) => (
            <Button
              key={config.id}
              variant={settings.defaultProvider === config.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => settings.setDefaultProvider(config.id)}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </Section>

      {/* Replay Tutorial */}
      <Section title="Tutorial">
        <Button
          variant="outline"
          size="sm"
          onClick={() => settings.resetOnboarding()}
        >
          Replay Tutorial
        </Button>
      </Section>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}
