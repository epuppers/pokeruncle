import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTrainerStore } from '@/stores/trainerStore'
import { PROVIDER_CONFIGS, type Provider } from '@/types/poker'

export function TrainerProviderSelector() {
  const { provider, setProvider } = useTrainerStore()

  return (
    <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROVIDER_CONFIGS.map((config) => (
          <SelectItem key={config.id} value={config.id}>
            {config.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
