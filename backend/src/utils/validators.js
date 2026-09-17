import { body, param, query, validationResult } from 'express-validator';

export function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      next();
    },
  ];
}

export const idParam = validate([param('id').isInt().withMessage('id must be an integer')]);

export const productIdParam = validate([param('productId').isInt().withMessage('productId must be an integer')]);

export const listQuery = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('search').optional().isString(),
]);

export const customerRules = validate([
  body('companyName').isString().trim().notEmpty().withMessage('companyName is required'),
  body('contactPerson').isString().trim().notEmpty().withMessage('contactPerson is required'),
  body('mobile').isString().trim().notEmpty().withMessage('mobile is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('email must be valid'),
  body('city').optional({ checkFalsy: true }).isString(),
]);

export const productRules = validate([
  body('productCode').isString().trim().notEmpty().withMessage('productCode is required'),
  body('productName').isString().trim().notEmpty().withMessage('productName is required'),
  body('category').optional({ checkFalsy: true }).isString(),
  body('unit').optional().isIn(['pieces', 'kg', 'liters', 'meters', 'boxes', 'rolls', 'sets']),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('basePrice must be >= 0'),
]);

export const enquiryRules = validate([
  body('customerId').isInt().withMessage('customerId is required (integer)'),
  body('enquiryDate').optional().isISO8601().withMessage('enquiryDate must be a valid date'),
  body('requiredDate').optional({ checkFalsy: true }).isISO8601().withMessage('requiredDate must be a valid date'),
  body('items').isArray({ min: 1 }).withMessage('at least one item is required'),
  body('items.*.productId').isInt().withMessage('item productId must be an integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('item quantity must be >= 1'),
  body('items.*.notes').optional({ nullable: true }).isString(),
]);

export const quotationRules = validate([
  body('enquiryId').isInt().withMessage('enquiryId is required'),
  body('customerId').optional().isInt(),
  body('validUntil').optional({ checkFalsy: true }).isISO8601().withMessage('validUntil must be a valid date'),
  body('items').optional().isArray(),
  body('items.*.productId').optional().isInt(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }),
  body('items.*.discountPercent').optional().isFloat({ min: 0, max: 100 }),
  body('items.*.gstPercent').optional().isFloat({ min: 0, max: 100 }),
]);

export const orderFromQuotationRules = validate([
  body('quotationId').isInt().withMessage('quotationId is required'),
]);

export const dispatchRules = validate([
  body('salesOrderId').isInt().withMessage('salesOrderId is required'),
  body('dispatchDate').optional({ checkFalsy: true }).isISO8601().withMessage('dispatchDate must be a valid date'),
  body('vehicleNumber').optional({ checkFalsy: true }).isString(),
  body('driverName').optional({ checkFalsy: true }).isString(),
  body('items').isArray({ min: 1 }).withMessage('at least one dispatch item is required'),
  body('items.*.productId').isInt().withMessage('item productId must be an integer'),
  body('items.*.quantityDispatched').isInt({ min: 1 }).withMessage('quantityDispatched must be >= 1'),
]);

export const stockRules = validate([
  body('productId').isInt().withMessage('productId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be >= 1'),
]);

export const setStockRules = validate([
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be >= 0'),
]);

export const loginRules = validate([
  body('email').isEmail().withMessage('valid email required'),
  body('password').isString().notEmpty().withMessage('password is required'),
]);

export const registerRules = validate([
  body('email').isEmail().withMessage('valid email required'),
  body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('role').optional().isIn(['ADMIN', 'SALES_USER']).withMessage('role must be ADMIN or SALES_USER'),
]);
