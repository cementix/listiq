import { Caveat, Instrument_Serif } from "next/font/google";

export const caveat = Caveat({
  subsets: ["latin"],
  weight: "400",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});
