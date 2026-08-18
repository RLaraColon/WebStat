import { WorksheetData } from '../types';

export const SAMPLE_DATASETS: { name: string; description: string; data: WorksheetData }[] = [
  {
    name: 'Control de Calidad - Rodamientos (SPC & Capacidad)',
    description: 'Diámetro de rodamientos de precisión (mm), subgrupos de tamaño 5 para Gráficos Xbar-R y Capacidad Cpk.',
    data: {
      id: 'sample-bearings',
      title: 'Control de Calidad - Rodamientos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [
        { id: 'C1', name: 'Muestra', type: 'numeric', width: 90 },
        { id: 'C2', name: 'Subgrupo', type: 'numeric', width: 90 },
        { id: 'C3', name: 'Diametro_mm', type: 'numeric', width: 140 },
        { id: 'C4', name: 'Dureza_HRC', type: 'numeric', width: 120 },
        { id: 'C5', name: 'Turno', type: 'text', width: 100 },
        { id: 'C6', name: 'Operador', type: 'text', width: 110 }
      ],
      rows: [
        // Subgroup 1
        { C1: 1, C2: 1, C3: 25.02, C4: 62.1, C5: 'Mañana', C6: 'Carlos' },
        { C1: 2, C2: 1, C3: 24.99, C4: 62.4, C5: 'Mañana', C6: 'Carlos' },
        { C1: 3, C2: 1, C3: 25.01, C4: 61.9, C5: 'Mañana', C6: 'Carlos' },
        { C1: 4, C2: 1, C3: 25.04, C4: 62.0, C5: 'Mañana', C6: 'Carlos' },
        { C1: 5, C2: 1, C3: 24.98, C4: 62.3, C5: 'Mañana', C6: 'Carlos' },
        // Subgroup 2
        { C1: 6, C2: 2, C3: 25.00, C4: 62.5, C5: 'Mañana', C6: 'Carlos' },
        { C1: 7, C2: 2, C3: 25.03, C4: 62.2, C5: 'Mañana', C6: 'Carlos' },
        { C1: 8, C2: 2, C3: 25.01, C4: 61.8, C5: 'Mañana', C6: 'Carlos' },
        { C1: 9, C2: 2, C3: 24.97, C4: 62.0, C5: 'Mañana', C6: 'Carlos' },
        { C1: 10, C2: 2, C3: 25.02, C4: 62.1, C5: 'Mañana', C6: 'Carlos' },
        // Subgroup 3
        { C1: 11, C2: 3, C3: 25.05, C4: 61.5, C5: 'Tarde', C6: 'Elena' },
        { C1: 12, C2: 3, C3: 25.01, C4: 62.0, C5: 'Tarde', C6: 'Elena' },
        { C1: 13, C2: 3, C3: 24.99, C4: 62.3, C5: 'Tarde', C6: 'Elena' },
        { C1: 14, C2: 3, C3: 25.02, C4: 62.1, C5: 'Tarde', C6: 'Elena' },
        { C1: 15, C2: 3, C3: 25.03, C4: 61.9, C5: 'Tarde', C6: 'Elena' },
        // Subgroup 4
        { C1: 16, C2: 4, C3: 24.98, C4: 62.2, C5: 'Tarde', C6: 'Elena' },
        { C1: 17, C2: 4, C3: 25.00, C4: 62.4, C5: 'Tarde', C6: 'Elena' },
        { C1: 18, C2: 4, C3: 24.96, C4: 62.0, C5: 'Tarde', C6: 'Elena' },
        { C1: 19, C2: 4, C3: 25.01, C4: 61.7, C5: 'Tarde', C6: 'Elena' },
        { C1: 20, C2: 4, C3: 24.99, C4: 62.3, C5: 'Tarde', C6: 'Elena' },
        // Subgroup 5
        { C1: 21, C2: 5, C3: 25.03, C4: 62.0, C5: 'Noche', C6: 'David' },
        { C1: 22, C2: 5, C3: 25.06, C4: 61.8, C5: 'Noche', C6: 'David' },
        { C1: 23, C2: 5, C3: 25.02, C4: 62.1, C5: 'Noche', C6: 'David' },
        { C1: 24, C2: 5, C3: 25.04, C4: 62.5, C5: 'Noche', C6: 'David' },
        { C1: 25, C2: 5, C3: 25.01, C4: 62.2, C5: 'Noche', C6: 'David' },
        // Subgroup 6
        { C1: 26, C2: 6, C3: 24.97, C4: 62.3, C5: 'Noche', C6: 'David' },
        { C1: 27, C2: 6, C3: 25.00, C4: 62.1, C5: 'Noche', C6: 'David' },
        { C1: 28, C2: 6, C3: 24.99, C4: 62.0, C5: 'Noche', C6: 'David' },
        { C1: 29, C2: 6, C3: 25.02, C4: 62.4, C5: 'Noche', C6: 'David' },
        { C1: 30, C2: 6, C3: 24.98, C4: 61.9, C5: 'Noche', C6: 'David' }
      ]
    }
  },
  {
    name: 'Rendimiento Químico y Variables (Regresión)',
    description: 'Rendimiento porcentual de una reacción en función de la temperatura (°C) y presión (bar).',
    data: {
      id: 'sample-chemical',
      title: 'Rendimiento Químico - Regresión',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [
        { id: 'C1', name: 'Ensayo', type: 'numeric', width: 90 },
        { id: 'C2', name: 'Temperatura_C', type: 'numeric', width: 140 },
        { id: 'C3', name: 'Presion_bar', type: 'numeric', width: 130 },
        { id: 'C4', name: 'Tiempo_min', type: 'numeric', width: 120 },
        { id: 'C5', name: 'Rendimiento_pct', type: 'numeric', width: 150 }
      ],
      rows: [
        { C1: 1, C2: 150, C3: 2.1, C4: 30, C5: 72.4 },
        { C1: 2, C2: 155, C3: 2.3, C4: 32, C5: 74.8 },
        { C1: 3, C2: 160, C3: 2.5, C4: 35, C5: 78.1 },
        { C1: 4, C2: 165, C3: 2.8, C4: 38, C5: 81.3 },
        { C1: 5, C2: 170, C3: 3.0, C4: 40, C5: 84.6 },
        { C1: 6, C2: 175, C3: 3.2, C4: 42, C5: 87.2 },
        { C1: 7, C2: 180, C3: 3.4, C4: 45, C5: 89.9 },
        { C1: 8, C2: 185, C3: 3.7, C4: 48, C5: 92.5 },
        { C1: 9, C2: 190, C3: 4.0, C4: 50, C5: 94.1 },
        { C1: 10, C2: 195, C3: 4.2, C4: 52, C5: 96.0 },
        { C1: 11, C2: 200, C3: 4.5, C4: 55, C5: 97.4 },
        { C1: 12, C2: 205, C3: 4.7, C4: 58, C5: 98.2 },
        { C1: 13, C2: 162, C3: 2.6, C4: 34, C5: 79.5 },
        { C1: 14, C2: 172, C3: 3.1, C4: 41, C5: 85.8 },
        { C1: 15, C2: 182, C3: 3.5, C4: 46, C5: 90.7 }
      ]
    }
  },
  {
    name: 'Comparación de Máquinas (ANOVA)',
    description: 'Tiempo de ciclo de producción (segundos) registrado en 3 máquinas industriales (A, B, C).',
    data: {
      id: 'sample-anova-machines',
      title: 'Comparación de Máquinas - ANOVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [
        { id: 'C1', name: 'ID_Lote', type: 'numeric', width: 90 },
        { id: 'C2', name: 'Maquina', type: 'text', width: 120 },
        { id: 'C3', name: 'Tiempo_Ciclo_s', type: 'numeric', width: 140 },
        { id: 'C4', name: 'Consumo_kWh', type: 'numeric', width: 130 }
      ],
      rows: [
        // Maquina A
        { C1: 1, C2: 'Maquina A', C3: 45.2, C4: 12.1 },
        { C1: 2, C2: 'Maquina A', C3: 46.1, C4: 12.3 },
        { C1: 3, C2: 'Maquina A', C3: 44.8, C4: 11.9 },
        { C1: 4, C2: 'Maquina A', C3: 45.9, C4: 12.4 },
        { C1: 5, C2: 'Maquina A', C3: 46.5, C4: 12.2 },
        { C1: 6, C2: 'Maquina A', C3: 45.0, C4: 12.0 },
        { C1: 7, C2: 'Maquina A', C3: 45.7, C4: 12.5 },
        // Maquina B
        { C1: 8, C2: 'Maquina B', C3: 48.3, C4: 14.1 },
        { C1: 9, C2: 'Maquina B', C3: 49.0, C4: 14.5 },
        { C1: 10, C2: 'Maquina B', C3: 47.9, C4: 13.9 },
        { C1: 11, C2: 'Maquina B', C3: 48.7, C4: 14.2 },
        { C1: 12, C2: 'Maquina B', C3: 49.5, C4: 14.7 },
        { C1: 13, C2: 'Maquina B', C3: 48.1, C4: 14.0 },
        { C1: 14, C2: 'Maquina B', C3: 49.2, C4: 14.4 },
        // Maquina C
        { C1: 15, C2: 'Maquina C', C3: 42.1, C4: 10.5 },
        { C1: 16, C2: 'Maquina C', C3: 41.8, C4: 10.2 },
        { C1: 17, C2: 'Maquina C', C3: 42.9, C4: 10.8 },
        { C1: 18, C2: 'Maquina C', C3: 43.0, C4: 10.9 },
        { C1: 19, C2: 'Maquina C', C3: 42.4, C4: 10.4 },
        { C1: 20, C2: 'Maquina C', C3: 41.5, C4: 10.1 },
        { C1: 21, C2: 'Maquina C', C3: 42.7, C4: 10.6 }
      ]
    }
  },
  {
    name: 'Evaluación de Capacitación (Prueba T)',
    description: 'Puntajes de examen antes y después de un programa de entrenamiento industrial (Prueba T pareada).',
    data: {
      id: 'sample-ttest-training',
      title: 'Capacitación - Prueba T Pareada',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [
        { id: 'C1', name: 'Empleado_ID', type: 'numeric', width: 110 },
        { id: 'C2', name: 'Pre_Test', type: 'numeric', width: 120 },
        { id: 'C3', name: 'Post_Test', type: 'numeric', width: 120 },
        { id: 'C4', name: 'Metodo', type: 'text', width: 110 }
      ],
      rows: [
        { C1: 101, C2: 68, C3: 84, C4: 'Virtual' },
        { C1: 102, C2: 72, C3: 89, C4: 'Virtual' },
        { C1: 103, C2: 65, C3: 78, C4: 'Virtual' },
        { C1: 104, C2: 70, C3: 86, C4: 'Virtual' },
        { C1: 105, C2: 74, C3: 92, C4: 'Presencial' },
        { C1: 106, C2: 61, C3: 79, C4: 'Presencial' },
        { C1: 107, C2: 78, C3: 95, C4: 'Presencial' },
        { C1: 108, C2: 69, C3: 88, C4: 'Presencial' },
        { C1: 109, C2: 73, C3: 90, C4: 'Presencial' },
        { C1: 110, C2: 66, C3: 83, C4: 'Virtual' },
        { C1: 111, C2: 71, C3: 87, C4: 'Virtual' },
        { C1: 112, C2: 75, C3: 93, C4: 'Presencial' }
      ]
    }
  },
  {
    name: 'Defectos en Línea de Ensamble (Gráfico P)',
    description: 'Inspección de lotes de 200 piezas y conteo de piezas defectuosas para Gráfico de Atributos P.',
    data: {
      id: 'sample-pchart-defects',
      title: 'Control de Atributos - Gráfico P',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [
        { id: 'C1', name: 'Lote', type: 'numeric', width: 90 },
        { id: 'C2', name: 'Inspeccionados', type: 'numeric', width: 140 },
        { id: 'C3', name: 'Defectuosos', type: 'numeric', width: 130 },
        { id: 'C4', name: 'Linea', type: 'text', width: 100 }
      ],
      rows: [
        { C1: 1, C2: 200, C3: 12, C4: 'L1' },
        { C1: 2, C2: 200, C3: 15, C4: 'L1' },
        { C1: 3, C2: 200, C3: 8, C4: 'L1' },
        { C1: 4, C2: 200, C3: 10, C4: 'L1' },
        { C1: 5, C2: 200, C3: 14, C4: 'L1' },
        { C1: 6, C2: 200, C3: 9, C4: 'L1' },
        { C1: 7, C2: 200, C3: 11, C4: 'L1' },
        { C1: 8, C2: 200, C3: 25, C4: 'L1' }, // out of control spike
        { C1: 9, C2: 200, C3: 13, C4: 'L1' },
        { C1: 10, C2: 200, C3: 10, C4: 'L1' },
        { C1: 11, C2: 200, C3: 7, C4: 'L1' },
        { C1: 12, C2: 200, C3: 12, C4: 'L1' },
        { C1: 13, C2: 200, C3: 14, C4: 'L1' },
        { C1: 14, C2: 200, C3: 11, C4: 'L1' },
        { C1: 15, C2: 200, C3: 9, C4: 'L1' }
      ]
    }
  }
];
