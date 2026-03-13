import { GoogleGenAI, Type } from "@google/genai";
import { ONTRecord } from "../types";

export const extractNokiaDataFromImage = async (file: File): Promise<ONTRecord[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const dataUrl = e.target?.result as string;
                if (!dataUrl) {
                    reject("No data read");
                    return;
                }

                // Extract base64 part
                const base64Data = dataUrl.split(',')[1];
                const mimeType = file.type;

                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

                const response = await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: {
                        parts: [
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data,
                                }
                            },
                            {
                                text: `Extract the following fields from the image:
1. 'NE' -> 'NOM MSAN'
2. 'Serial Number' -> 'SN EN HÉXA'
3. 'Object Name' -> 'EMPLACEMENT'

Return a JSON array of objects with the following properties:
- msan (from 'NE')
- sn (from 'Serial Number')
- location (from 'Object Name')
`
                            }
                        ]
                    },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    msan: { type: Type.STRING, description: "The NE value" },
                                    sn: { type: Type.STRING, description: "The Serial Number value" },
                                    location: { type: Type.STRING, description: "The Object Name value" }
                                },
                                required: ["msan", "sn", "location"]
                            }
                        }
                    }
                });

                const jsonStr = response.text?.trim() || "[]";
                const extractedData = JSON.parse(jsonStr);

                const records: ONTRecord[] = extractedData.map((item: any, index: number) => ({
                    id: `img-${Date.now()}-${index}`,
                    msan: item.msan || "INCONNU",
                    sn: item.sn || "INCONNU",
                    location: item.location || "INCONNU",
                    status: "active",
                    vendorId: "ALCL", // Nokia vendor ID
                    version: "ALCL",
                    rxPower: "",
                    distance: ""
                }));

                resolve(records);
            } catch (err) {
                console.error("Error extracting data from image:", err);
                reject("Failed to extract data from image");
            }
        };
        reader.onerror = () => reject("Failed to read file");
        reader.readAsDataURL(file);
    });
};
