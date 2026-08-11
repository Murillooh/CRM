import { expect, test, describe } from 'vitest';
import { can, requirePermission, AuthorizationError, Role } from '../permissions';

describe('RBAC Matrix', () => {
  describe('OWNER', () => {
    test('Tem acesso a tudo', () => {
      expect(can('OWNER', 'delete', 'Billing')).toBe(true);
      expect(can('OWNER', 'create', 'Deal')).toBe(true);
    });
  });

  describe('ADMIN', () => {
    test('Acessa tudo exceto Billing', () => {
      expect(can('ADMIN', 'update', 'Settings')).toBe(true);
      expect(can('ADMIN', 'delete', 'Deal')).toBe(true);
      expect(can('ADMIN', 'read', 'Billing')).toBe(false);
    });
  });

  describe('MANAGER', () => {
    test('Pode fazer CRUD no CRM, não em Settings/Billing', () => {
      expect(can('MANAGER', 'delete', 'Deal')).toBe(true);
      expect(can('MANAGER', 'create', 'Contact')).toBe(true);
      
      expect(can('MANAGER', 'read', 'Settings')).toBe(false);
      expect(can('MANAGER', 'update', 'Billing')).toBe(false);
    });
  });

  describe('SALES_REP', () => {
    test('Pode ler e criar dados, mas não deletar', () => {
      expect(can('SALES_REP', 'create', 'Deal')).toBe(true);
      expect(can('SALES_REP', 'read', 'Company')).toBe(true);
      expect(can('SALES_REP', 'update', 'Task')).toBe(true);
      
      expect(can('SALES_REP', 'delete', 'Deal')).toBe(false);
      expect(can('SALES_REP', 'delete', 'Contact')).toBe(false);
      
      expect(can('SALES_REP', 'read', 'Settings')).toBe(false);
    });
  });

  describe('VIEWER', () => {
    test('Só pode ler, e não acessa configs', () => {
      expect(can('VIEWER', 'read', 'Deal')).toBe(true);
      expect(can('VIEWER', 'update', 'Deal')).toBe(false);
      expect(can('VIEWER', 'create', 'Contact')).toBe(false);
      expect(can('VIEWER', 'delete', 'Task')).toBe(false);
      
      expect(can('VIEWER', 'read', 'Settings')).toBe(false);
    });
  });

  describe('requirePermission guard', () => {
    test('Lança erro 403 (AuthorizationError) se acesso negado', () => {
      expect(() => requirePermission('VIEWER', 'update', 'Deal')).toThrow(AuthorizationError);
      expect(() => requirePermission('SALES_REP', 'delete', 'Company')).toThrow('Access denied: Cannot delete Company as SALES_REP');
    });

    test('Não lança erro se acesso permitido', () => {
      expect(() => requirePermission('MANAGER', 'delete', 'Deal')).not.toThrow();
    });
  });
});
