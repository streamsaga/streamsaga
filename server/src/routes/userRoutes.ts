import { Router } from 'express';
import { listUsers, getUserById, updateUserRole, toggleUserActive, deleteUser, createUser } from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema } from '../validators/userValidators';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.get('/:id', getUserById);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/active', toggleUserActive);
router.delete('/:id', deleteUser);

export default router;
