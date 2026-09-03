/**
 * ==========================================
 * VALIDAÇÃO DE ENTRADA — CADASTRO E LOGIN
 * ==========================================
 * Funções puras que recebem o corpo (body) de uma requisição e retornam
 * uma lista de mensagens de erro. Lista vazia = entrada válida.
 * Mantidas sem dependências externas (nível adequado a um TCC).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { name } = body ?? {};

  if (isBlank(name)) {
    errors.push('Nome da piscina é obrigatório.');
  } else if (name.trim().length > 100) {
    errors.push('Nome da piscina deve ter no máximo 100 caracteres.');
  }

  return errors;
}

export function validateReading(body) {
  const errors = [];
  const { ph, cl, temp } = body ?? {};

  if (typeof ph !== 'number' || Number.isNaN(ph)) errors.push('pH é obrigatório e deve ser numérico.');
  else if (ph < 0 || ph > 14) errors.push('pH deve estar entre 0 e 14.');

  if (typeof cl !== 'number' || Number.isNaN(cl)) errors.push('Cloro (cl) é obrigatório e deve ser numérico.');
  else if (cl < 0) errors.push('Cloro não pode ser negativo.');

  if (typeof temp !== 'number' || Number.isNaN(temp)) errors.push('Temperatura é obrigatória e deve ser numérica.');

  return errors;
}
