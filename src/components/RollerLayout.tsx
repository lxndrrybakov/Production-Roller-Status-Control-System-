import React, { useEffect, useState } from 'react';
import { rollerCoordinates } from '../constants/rollerCoordinates';
import { RollerStatusIndicator } from './RollerStatusIndicator';
import { rollerStatusService, RollerStatus } from '../services/rollerStatusService';
import { RollerStatusSummary } from './RollerStatusSummary';

interface RollerLayoutProps {
  onRollerClick: (rollerNumber: number, lineNumber: number) => void;
}

export const RollerLayout: React.FC<RollerLayoutProps> = ({ onRollerClick }) => {
  const [status, setStatus] = useState<RollerStatus>({
    issues: {
      mechanical: {},
      electrical: {}
    }
  });

  useEffect(() => {
    const unsubscribe = rollerStatusService.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  const renderRoller = (rollerNumber: number, row: number, adjustedX: number, adjustedY: number) => {
    const key = `${row}-${rollerNumber}`;
    const zoneHeight = 53;

    return (
      <React.Fragment key={`row${row}-roller${rollerNumber}`}>
        <area
          shape="rect"
          coords={`${adjustedX},${adjustedY},${adjustedX + 20},${adjustedY + zoneHeight}`}
          onClick={(e) => {
            e.preventDefault();
            onRollerClick(rollerNumber, row);
          }}
          href="#"
          alt={`Ролик ${rollerNumber} (Ряд ${row})`}
          title={`Ролик ${rollerNumber} (Ряд ${row})`}
        />
        <div 
          className="absolute"
          style={{
            left: `${adjustedX + 10}px`,
            top: `${adjustedY + (zoneHeight / 2)}px`,
            position: 'absolute',
            zIndex: 20,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        >
          <RollerStatusIndicator 
            mechanicalIssues={status.issues.mechanical[key] || 0}
            electricalIssues={status.issues.electrical[key] || 0}
          />
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Ролики отводящего рольганга</h2>
      <RollerStatusSummary />
      <div className="relative inline-block">
        <img 
          src="https://i.imghippo.com/files/YPZ3822EPE.jpg"
          useMap="#roller-map" 
          className="max-w-full h-auto select-none"
          style={{
            width: '100%',
            maxWidth: '3500px',
            height: 'auto',
            objectFit: 'contain',
            imageRendering: 'crisp-edges'
          }}
          alt="Схема роликов"
          draggable={false}
        />
        
        <map name="roller-map">
          {/* Ряд 1 (ролики 1-25) */}
          {Array.from({ length: 25 }, (_, i) => {
            const rollerNumber = i + 1;
            const adjustedX = 76.01 + (rollerNumber * 45.1);
            const adjustedY = 208;
            return renderRoller(rollerNumber, 1, adjustedX, adjustedY);
          })}

          {/* Ряд 2 (ролики 26-51) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 26 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 416;
            return renderRoller(rollerNumber, 2, adjustedX, adjustedY);
          })}

          {/* Ряд 3 (ролики 52-77) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 52 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 626;
            return renderRoller(rollerNumber, 3, adjustedX, adjustedY);
          })}

          {/* Ряд 4 (ролики 78-103) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 78 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 828;
            return renderRoller(rollerNumber, 4, adjustedX, adjustedY);
          })}

          {/* Ряд 5 (ролики 104-129) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 104 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 1123;
            return renderRoller(rollerNumber, 5, adjustedX, adjustedY);
          })}

          {/* Ряд 6 (ролики 130-155) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 130 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 1326;
            return renderRoller(rollerNumber, 6, adjustedX, adjustedY);
          })}

          {/* Ряд 7 (ролики 156-181) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 156 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 1531;
            return renderRoller(rollerNumber, 7, adjustedX, adjustedY);
          })}

          {/* Ряд 8 (ролики 182-207) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 182 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 1738;
            return renderRoller(rollerNumber, 8, adjustedX, adjustedY);
          })}

          {/* Ряд 9 (ролики 208-233) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 208 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 2033;
            return renderRoller(rollerNumber, 9, adjustedX, adjustedY);
          })}

          {/* Ряд 10 (ролики 234-259) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 234 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 2240;
            return renderRoller(rollerNumber, 10, adjustedX, adjustedY);
          })}

          {/* Ряд 11 (ролики 260-285) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 260 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 2445;
            return renderRoller(rollerNumber, 11, adjustedX, adjustedY);
          })}

          {/* Ряд 12 (ролики 286-311) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 286 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 2652;
            return renderRoller(rollerNumber, 12, adjustedX, adjustedY);
          })}

          {/* Ряд 13 (ролики 312-337) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 312 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 2950;
            return renderRoller(rollerNumber, 13, adjustedX, adjustedY);
          })}

          {/* Ряд 14 (ролики 338-363) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 338 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 3155;
            return renderRoller(rollerNumber, 14, adjustedX, adjustedY);
          })}

          {/* Ряд 15 (ролики 364-389) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 364 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 3362;
            return renderRoller(rollerNumber, 15, adjustedX, adjustedY);
          })}

          {/* Ряд 16 (ролики 390-415) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 390 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 3570;
            return renderRoller(rollerNumber, 16, adjustedX, adjustedY);
          })}

          {/* Ряд 17 (ролики 416-441) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 416 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 3890;
            return renderRoller(rollerNumber, 17, adjustedX, adjustedY);
          })}

          {/* Ряд 18 (ролики 442-467) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 442 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 4094;
            return renderRoller(rollerNumber, 18, adjustedX, adjustedY);
          })}

          {/* Ряд 19 (ролики 468-493) */}
          {Array.from({ length: 26 }, (_, i) => {
            const rollerNumber = 468 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 4302;
            return renderRoller(rollerNumber, 19, adjustedX, adjustedY);
          })}

          {/* Ряд 20 (ролики 494-508) */}
          {Array.from({ length: 15 }, (_, i) => {
            const rollerNumber = 494 + i;
            const adjustedX = 77.01 + (i * 45.1);
            const adjustedY = 4510;
            return renderRoller(rollerNumber, 20, adjustedX, adjustedY);
          })}
        </map>
      </div>
    </div>
  );
};