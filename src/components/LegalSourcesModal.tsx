import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { LEGAL_MODEL_SOURCES } from '../data/anatomyCatalog';

interface LegalSourcesModalProps {
  open: boolean;
  onClose: () => void;
}

export const LegalSourcesModal: React.FC<LegalSourcesModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldCheck size={20} className="text-cyan" />
            <h2>Fontes de Modelos 3D (.GLB), Licenças e Conformidade</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar modal de fontes e licenças"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-intro">
            O <strong>Anatomia3D Studio</strong> utiliza malhas anatômicas 3D
            reais (`.glb`) provenientes de bases científicas abertas (
            <em>BodyParts3D / DBCLS</em>, <em>NIH 3D</em> e repositórios
            públicos sob licença Creative Commons / MIT) armazenadas em{' '}
            <code>public/models/</code>.
          </p>

          <div className="sources-grid">
            {LEGAL_MODEL_SOURCES.map((src) => (
              <div key={src.id} className="source-card">
                <div className="source-card-top">
                  <h3>{src.title}</h3>
                  <span className="license-badge">{src.license}</span>
                </div>
                <p className="source-org">{src.organization}</p>
                <p className="source-usage">{src.usageInApp}</p>
                <div className="source-links">
                  {src.sourceUrl.startsWith('http') && (
                    <a
                      href={src.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Acessar Repositório Oficial ↗
                    </a>
                  )}
                  <a
                    href={src.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Texto da Licença ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
