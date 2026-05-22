export const IDR_PER_EUR = 20558.27

export const idrToEur = (idr, decimals = 0) => {
  if (!idr || isNaN(parseFloat(idr))) return null
  return (parseFloat(idr) / IDR_PER_EUR).toFixed(decimals)
}
