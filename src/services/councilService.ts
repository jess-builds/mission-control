import axios from 'axios';
import { Persona, RoundTemplate } from '@/types/council';

const API_BASE = '/api/council';

export class CouncilService {
  /**
   * Get all available personas
   */
  static async getPersonas(): Promise<Persona[]> {
    const response = await axios.get(`${API_BASE}/personas`);
    return response.data;
  }

  /**
   * Get a specific persona by role
   */
  static async getPersona(role: string): Promise<Persona> {
    const response = await axios.get(`${API_BASE}/personas/${role}`);
    return response.data;
  }

  /**
   * Update a persona
   */
  static async updatePersona(role: string, persona: Persona): Promise<Persona> {
    const response = await axios.put(`${API_BASE}/personas/${role}`, persona);
    return response.data.persona;
  }

  /**
   * Get available round templates
   */
  static async getTemplates(): Promise<Record<string, RoundTemplate>> {
    const response = await axios.get(`${API_BASE}/templates`);
    return response.data;
  }

  /**
   * Create a custom template
   */
  static async createTemplate(template: {
    name: string;
    description: string;
    rounds: any[];
  }): Promise<any> {
    const response = await axios.post(`${API_BASE}/templates`, template);
    return response.data;
  }
}

export default CouncilService;