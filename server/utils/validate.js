/**
 * ==========================================
 * VALIDAÇÃO DE ENTRADA — CADASTRO E LOGIN
 * ==========================================
 * Funções puras que recebem o corpo (body) de uma requisição e retornam
 * uma lista de mensagens de erro. Lista vazia = entrada válida.
 * Mantidas sem dependências externas (nível adequado a um TCC).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIZE_DIMENSIONS_RE = /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)(?:\s*x\s*(\d+(?:[.,]\d+)?))?\s*m(?:etros?)?$/i;
const SIZE_VOLUME_RE = /^~?\s*([\d.,]+)\s*(?:l|litros?)$/i;

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

export function validateRegister(body) {
  const errors = [];
  const { name, email, password } = body ?? {};

  if (isBlank(name)) {
    errors.push('Nome é obrigatório.');
  } else if (name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres.');
  }

  if (isBlank(email)) {
    errors.push('E-mail é obrigatório.');
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.push('E-mail em formato inválido.');
  }

  if (isBlank(password)) {
    errors.push('Senha é obrigatória.');
  } else if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres.');
  }

  return errors;
}

export function validateLogin(body) {
  const errors = [];
  const { email, password } = body ?? {};

  if (isBlank(email)) errors.push('E-mail é obrigatório.');
  if (isBlank(password)) errors.push('Senha é obrigatória.');

  return errors;
}

export function validateProfile(body) {
  const errors = [];
  const { name, email, currentPassword } = body ?? {};

  if (isBlank(name)) {
    errors.push('Nome é obrigatório.');
  } else if (name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres.');
  }

  if (isBlank(email)) {
    errors.push('E-mail é obrigatório.');
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.push('E-mail em formato inválido.');
  }

  if (isBlank(currentPassword)) errors.push('Senha atual é obrigatória.');

  return errors;
}

export function validatePasswordChange(body) {
  const errors = [];
  const { currentPassword, newPassword, confirmPassword } = body ?? {};

  if (isBlank(currentPassword)) errors.push('Senha atual é obrigatória.');
  if (isBlank(newPassword)) {
    errors.push('Nova senha é obrigatória.');
  } else if (newPassword.length < 8) {
    errors.push('Nova senha deve ter pelo menos 8 caracteres.');
  }
  if (newPassword !== confirmPassword) errors.push('A confirmação da nova senha não confere.');

  return errors;
}

export function validatePool(body) {
  const errors = [];
  const { name, size } = body ?? {};

  if (isBlank(name)) {
    errors.push('Nome da piscina é obrigatório.');
  } else if (name.trim().length > 100) {
    errors.push('Nome da piscina deve ter no máximo 100 caracteres.');
  }

  if (typeof size === 'string' && size.trim()) {
    const normalizedSize = size.trim();
    const dimensions = normalizedSize.match(SIZE_DIMENSIONS_RE);
    const volume = normalizedSize.match(SIZE_VOLUME_RE);

    if (dimensions) {
      const values = dimensions.slice(1).filter(Boolean).map(value => Number(value.replace(',', '.')));
      if (values.some(value => value < 1 || value > 100)) {
        errors.push('Cada dimensão da piscina deve estar entre 1 m e 100 m.');
      }
    } else if (volume) {
      const liters = Number(volume[1].replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(liters) || liters < 100 || liters > 10000000) {
        errors.push('O volume deve estar entre 100 L e 10.000.000 L.');
      }
    } else {
      errors.push('Informe o tamanho no formato 8 x 4 m ou 45.000 L.');
    }
  }

  return errors;
}

export function validateReading(body) {
  const errors = [];
  const { ph, cl } = body ?? {};

  if (typeof ph !== 'number' || Number.isNaN(ph)) errors.push('pH é obrigatório e deve ser numérico.');
  else if (ph < 0 || ph > 14) errors.push('pH deve estar entre 0 e 14.');

  if (typeof cl !== 'number' || Number.isNaN(cl)) errors.push('Cloro (cl) é obrigatório e deve ser numérico.');
  else if (cl < 0) errors.push('Cloro não pode ser negativo.');

  return errors;
}
