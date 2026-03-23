/** Etiquetas en español para métodos de pago (valores API en inglés). */
export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "TRANSFER":
      return "Transferencia";
    case "CARD":
      return "Tarjeta";
    case "OTHER":
      return "Otro";
    default:
      return method;
  }
}
