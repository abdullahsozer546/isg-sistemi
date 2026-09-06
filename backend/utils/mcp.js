const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

// Dummy İK (İnsan Kaynakları) Veritabanı
const mockHrDatabase = {
  "Ahmet Yılmaz": { hasTraining: false, lastTrainingDate: null, department: "Kaynak Atölyesi" },
  "Ayşe Demir": { hasTraining: true, lastTrainingDate: "2025-05-10", department: "Depo" },
  "Mehmet Kaya": { hasTraining: true, lastTrainingDate: "2026-01-15", department: "Üretim Bandı" },
};

// Basit bir MCP (Model Context Protocol) Sunucusu oluşturuyoruz
const server = new Server(
  {
    name: "isg-hr-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// MCP Tool'larını (Yeteneklerini) Tanımla
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check_employee_training",
        description: "Bir çalışanın İSG ve makine kullanım eğitimi alıp almadığını kontrol eder. Kök neden analizi yaparken çalışanın eğitim eksikliğini tespit etmek için kullanılır.",
        inputSchema: {
          type: "object",
          properties: {
            employeeName: {
              type: "string",
              description: "Çalışanın ad ve soyadı (Örn: Ahmet Yılmaz)",
            },
          },
          required: ["employeeName"],
        },
      },
    ],
  };
});

// MCP Tool çağrıldığında çalışacak mantık
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "check_employee_training") {
    const employeeName = request.params.arguments.employeeName;
    const record = mockHrDatabase[employeeName];

    if (!record) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Sistemde böyle bir çalışan bulunamadı." }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(record),
        },
      ],
    };
  }
  
  throw new Error(`Tool not found: ${request.params.name}`);
});

// Gemini'ye uygun Function Declaration formatı
const mcpToolsForGemini = [
  {
    name: "check_employee_training",
    description: "Bir çalışanın İSG ve makine kullanım eğitimi alıp almadığını kontrol eder. Kök neden analizi yaparken çalışanın eğitim eksikliğini tespit etmek için kullanılır.",
    parameters: {
      type: "OBJECT",
      properties: {
        employeeName: {
          type: "STRING",
          description: "Çalışanın ad ve soyadı (Örn: Ahmet Yılmaz)",
        },
      },
      required: ["employeeName"],
    },
  }
];

// Dışarıya açılan yardımcı fonksiyon (Gemini'den gelen tool call'u MCP'ye yönlendirir)
async function executeMcpTool(toolName, args, models) {
  // Gerçek bir MCP yapısında bu istek bir Client üzerinden Local/SSE Transport ile Sunucuya gider.
  // Burada MVP için Server'ın Handler'ını direkt simüle ediyoruz.
  try {
    if (toolName === "check_employee_training") {
      if (models && models.Employee) {
        const record = await models.Employee.findOne({ where: { name: args.employeeName } });
        if (!record) return "Çalışan kaydı bulunamadı.";
        return `Çalışan: ${args.employeeName}, Eğitim Durumu: ${record.hasTraining ? 'Eğitim Aldı' : 'Eğitim ALMADI'}`;
      } else {
        // Fallback for mock testing if DB is not passed
        const record = mockHrDatabase[args.employeeName];
        if (!record) return "Çalışan kaydı bulunamadı.";
        return `Çalışan: ${args.employeeName}, Eğitim Durumu: ${record.hasTraining ? 'Eğitim Aldı' : 'Eğitim ALMADI'}`;
      }
    }
    return "Bilinmeyen araç.";
  } catch (error) {
    console.error("MCP Tool çalıştırma hatası:", error);
    return "Araç çalıştırılırken hata oluştu.";
  }
}

module.exports = { mcpToolsForGemini, executeMcpTool, server };
