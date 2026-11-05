import { ButtonIcon } from '../../actions/ButtonIcon';
import { IconFullscreen, IconZoomIn, IconZoomOut } from '../../icons/suite';
import styles from './ChartMap.module.css';

interface ChartMapZoomControlsProps {
  canReset: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Aproximar, afastar e voltar ao enquadramento, no canto da area de desenho. */
export function ChartMapZoomControls({ canReset, canZoomIn, canZoomOut, onReset, onZoomIn, onZoomOut }: ChartMapZoomControlsProps) {
  return (
    <div className={styles.zoomControls}>
      <ButtonIcon disabled={!canZoomIn} icon={<IconZoomIn size={14} />} label="Aproximar" onClick={onZoomIn} size="sm" tooltipPlacement="left" />
      <ButtonIcon disabled={!canZoomOut} icon={<IconZoomOut size={14} />} label="Afastar" onClick={onZoomOut} size="sm" tooltipPlacement="left" />
      <ButtonIcon
        disabled={!canReset}
        icon={<IconFullscreen size={14} />}
        label="Voltar ao enquadramento"
        onClick={onReset}
        size="sm"
        tooltipPlacement="left"
      />
    </div>
  );
}

/** O que o leitor de tela ouve da escala; o enquadramento inicial so e anunciado quando a vista volta a ele. */
export function zoomAnnouncement(scale: number, backToInitial: boolean) {
  if (scale > 1) {
    return `Aproximação de ${String(Math.round(scale * 10) / 10).replace('.', ',')} vezes`;
  }

  return backToInitial ? 'Enquadramento inicial' : '';
}

/** A rolagem sem a tecla rola a pagina; a dica diz como aproximar. */
export function zoomHint() {
  const key = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

  return `Use ${key} + rolagem para aproximar`;
}
