export interface CurrencyEvent {
  id: number
  code: string
  symbol: string
  name: string
  active?: boolean
  isDefault?: boolean
  createdAt: Date | string
  modifiedAt: Date | string | null
}