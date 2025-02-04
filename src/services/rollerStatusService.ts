import { Subject } from '../utils/subject';
import { databaseService } from './databaseService';
import { RollerStatusMap } from '../types';

export interface RollerStatus {
  issues: {
    mechanical: RollerStatusMap;
    electrical: RollerStatusMap;
  };
}

export interface RollerStatusData {
  jamming_count: number;
  last_records: any[];
  last_jamming: any[];
}

class RollerStatusService {
  private statusSubject = new Subject<RollerStatus>({
    issues: {
      mechanical: {},
      electrical: {}
    }
  });

  constructor() {
    this.updateStatus();
    setInterval(() => this.updateStatus(), 5000);
  }

  async updateStatus() {
    const status: RollerStatus = {
      issues: {
        mechanical: {},
        electrical: {}
      }
    };

    try {
      // Получаем списки причин для каждой службы
      const [
        { data: mechanicalReasons },
        { data: electricalReasons }
      ] = await Promise.all([
        databaseService.query(client =>
          client.rpc('get_service_reasons', { p_service_type: 'mechanical' })
        ),
        databaseService.query(client =>
          client.rpc('get_service_reasons', { p_service_type: 'electrical' })
        )
      ]);

      const mechanicalReasonsList = mechanicalReasons?.map(r => r.reason) || [];
      const electricalReasonsList = electricalReasons?.map(r => r.reason) || [];

      // Получаем все неразрешенные записи
      const { data: records } = await databaseService.query(client =>
        client
          .from('jamming_records')
          .select('roller_number,line_number,reason')
          .eq('resolved', false)
      );

      if (records) {
        // Распределяем записи по службам на основе причин
        records.forEach(record => {
          const key = `${record.line_number}-${record.roller_number}`;
          
          if (mechanicalReasonsList.includes(record.reason)) {
            status.issues.mechanical[key] = (status.issues.mechanical[key] || 0) + 1;
          }
          if (electricalReasonsList.includes(record.reason)) {
            status.issues.electrical[key] = (status.issues.electrical[key] || 0) + 1;
          }
        });
      }

      this.statusSubject.next(status);
    } catch (error) {
      console.error('Error updating status:', error);
      // При ошибке сохраняем текущее состояние
      this.statusSubject.next(this.statusSubject.getValue());
    }
  }

  subscribe(callback: (status: RollerStatus) => void) {
    return this.statusSubject.subscribe(callback);
  }

  getStatus(): RollerStatus {
    return this.statusSubject.getValue();
  }

  async fetchRollerDetails(rollerNumber: number, lineNumber: number): Promise<RollerStatusData> {
    try {
      const { data: jammingData } = await databaseService.query(client =>
        client
          .from('jamming_records')
          .select('*')
          .eq('roller_number', rollerNumber)
          .eq('line_number', lineNumber)
          .order('date', { ascending: false })
          .limit(3)
      );

      const activeIssues = (jammingData || []).filter(record => !record.resolved).length;

      return {
        jamming_count: activeIssues,
        last_records: [],
        last_jamming: jammingData || []
      };
    } catch (error) {
      console.error('Error fetching roller details:', error);
      return {
        jamming_count: 0,
        last_records: [],
        last_jamming: []
      };
    }
  }
}

export const rollerStatusService = new RollerStatusService();