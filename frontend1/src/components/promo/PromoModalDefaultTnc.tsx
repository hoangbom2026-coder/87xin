import * as React from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { promoModalDefaultCopy } from './promoModalDefaultCopy'

export interface PromoModalDefaultTncProps {
  lead?: string
}

const PreLine: React.FC<{ children: string }> = ({ children }) => (
  <span className="promo-modal-preline">{children}</span>
)

/** Nội dung T&C mặc định — class theo template HTML (red-underline, promo-modal-tnc, promo_table, msg-in). */
const PromoModalDefaultTnc: React.FC<PromoModalDefaultTncProps> = ({ lead }) => {
  const { language } = useLanguage()
  const c = promoModalDefaultCopy[language] ?? promoModalDefaultCopy.en

  return (
    <>
      {lead?.trim() ? <p className="basic-text promo-modal-lead">{lead.trim()}</p> : null}

      <p className="red-underline">{c.participateTitle}</p>
      <ul className="promo-modal-tnc">
        <li>
          <span>1</span>
          {c.tnc1}
        </li>
        <li>
          <span>2</span>
          {c.tnc2}
        </li>
        <li>
          <span>3</span>
          {c.tnc3}
        </li>
      </ul>

      <p className="red-underline">{c.howApplyTitle}</p>
      <ul className="promo-modal-tnc">
        <li>
          <span>1</span>
          <PreLine>{c.apply1}</PreLine>
        </li>
        <li>
          <span>2</span>
          {c.apply2}
        </li>
        <li>
          <span>3</span>
          {c.apply3}
        </li>
      </ul>

      <div className="msg-in">
        <p className="red-underline">{c.detailsTitle}</p>
        <div className="promo-detail-modal__table-scroll">
          <table className="promo_table table-responsive">
            <tbody>
              <tr>
                <th>{c.thProvider}</th>
                <th>{c.thBonus}</th>
                <th>{c.thMax}</th>
                <th>{c.thTurnover}</th>
              </tr>
              <tr>
                <td>{c.rowLive}</td>
                <td rowSpan={4}>{c.bonusPct}</td>
                <td>{c.max300a}</td>
                <td>{c.turnover25}</td>
              </tr>
              <tr>
                <td>{c.rowSlots}</td>
                <td>{c.max300b}</td>
                <td>{c.turnover20a}</td>
              </tr>
              <tr>
                <td>{c.rowSports}</td>
                <td>{c.max300b}</td>
                <td>{c.turnover20b}</td>
              </tr>
              <tr>
                <td>{c.rowEmpty}</td>
                <td>{c.max200}</td>
                <td>{c.turnover4}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="basic-text">{c.rebateNote}</p>

        <p className="red-underline">{c.exampleTitle}</p>
        <div className="promo-detail-modal__table-scroll">
          <table className="promo_table table-responsive">
            <tbody>
              <tr>
                <th>{c.thFormula}</th>
                <th>{c.thFormulaVal}</th>
              </tr>
              <tr>
                <td>{c.exRow1a}</td>
                <td>{c.exRow1b}</td>
              </tr>
              <tr>
                <td>{c.exRow2a}</td>
                <td>
                  <PreLine>{c.exRow2b}</PreLine>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="red-underline">{c.slotsSectionTitle}</p>
        <p className="basic-text">{c.slotsSectionBody}</p>

        <p className="red-underline">{c.megaSectionTitle}</p>
        <p className="basic-text">
          <PreLine>{c.megaSectionBody}</PreLine>
        </p>

        <p className="red-underline">{c.rulesTitle}</p>
        <p className="basic-text">
          <PreLine>{c.rulesBody}</PreLine>
        </p>
      </div>
    </>
  )
}

export default PromoModalDefaultTnc
