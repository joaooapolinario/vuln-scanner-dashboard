import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isIP,
  isFQDN,
} from 'class-validator';

@ValidatorConstraint({ name: 'isTarget', async: false })
export class IsTargetConstraint implements ValidatorConstraintInterface {
  validate(target: any) {
    if (typeof target !== 'string') return false;
    // O alvo não pode conter espaços
    if (target.includes(' ')) return false;
    
    // Aceita IP V4/V6 ou um FQDN válido (Domínio)
    // passamos require_tld: false para permitir targets locais como 'localhost' ou 'server-1'
    return isIP(target) || isFQDN(target, { require_tld: false });
  }

  defaultMessage() {
    return 'Alvo ($value) inválido. Deve ser um IP válido ou um domínio válido, sem caracteres especiais de injeção.';
  }
}

export function IsTarget(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTargetConstraint,
    });
  };
}
