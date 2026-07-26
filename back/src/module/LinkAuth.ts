import Session from '../components/session.js';
import Validator from '../utils/validator.js';
import { Request, Response } from 'express';
import LinkRepository from './LinkRepository.js';
import Bcrypt from '../utils/bcrypt.js';

class LinkAuth {
  constructor(
    private readonly session = Session,
    private readonly validator = Validator,
    private readonly repository = LinkRepository,
    private readonly bcrypt = Bcrypt,
  ) {}

  async resolveUserId(req: Request) {
    const candidate =
      req.session?.user?.id ??
      req.body?.usuario_id ??
      req.body?.usuarioId ??
      req.query?.usuarioId ??
      req.params?.usuarioId;

    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async login(req: Request, res: Response) {
    const { gmail, email, password } = req.body;
    const normalizedEmail = gmail ?? email;

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Correo electrónico y contraseña son requeridos',
      });
    }

    const emailValidation = await this.validator.validateEmail(normalizedEmail);
    if (!emailValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Correo electrónico inválido',
      });
    }

    const passwordValidation = await this.validator.validatePassword(password);
    if (!passwordValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña inválida',
      });
    }

    const user = await this.repository.getUserByEmail(normalizedEmail);

    if (!user || user.length === 0 || !user[0]) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const valid = await this.bcrypt.compare(password, user[0].password_hash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta',
      });
    }
    console.log('Usuario autenticado:', user[0].email);
    await this.session.createSession({ request: req, response: res }, user);
  }

  async register(req: Request, res: Response) {
    const { nombre, name, gmail, email, password } = req.body;
    const normalizedName = (nombre ?? name ?? '').trim();
    const normalizedEmail = (gmail ?? email ?? '').trim();
    const normalizedPassword = password ?? '';

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los datos son requeridos',
      });
    }

    const nameValidation = await this.validator.validateUsername(normalizedName);
    if (!nameValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario inválido',
      });
    }

    const emailValidation = await this.validator.validateEmail(normalizedEmail);
    if (!emailValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Correo electrónico inválido',
      });
    }

    const passwordValidation = await this.validator.validatePassword(normalizedPassword);
    if (!passwordValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña inválida',
      });
    }

    const existingUser = await this.repository.getUserByEmail(normalizedEmail);
    if (!existingUser || existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
      });
    }

    const hashedPassword = await this.bcrypt.hash(password);
    // await this.repository.createUser(normalizedName, normalizedEmail, hashedPassword);

    return res.status(201).json({
      success: true,
      message: 'Se ha creado el usuario correctamente',
    });
  }

  async logout(req: Request, res: Response) {
    return this.session.destroySession({ request: req, response: res });
  }

  // async deleteUser(req: Request, res: Response) {
  //   try {
  //     const usuarioId = req.body?.id ?? (await this.resolveUserId(req));

  //     if (!usuarioId) {
  //       return res.status(400).json({ success: false, message: 'Usuario inválido' });
  //     }
  //     const data = await this.repository.deleteUserAccount(usuarioId);
  //     req.session.destroy(() => {});
  //     return res.json({ success: true, data });
  //   } catch (error) {
  //     return res.status(500).json({ success: false, message: 'No se pudo eliminar la cuenta' });
  //   }
  // }

  // async updateUser(req: Request, res: Response) {
  //   try {
  //     const usuarioId = req.body?.id ?? (await this.resolveUserId(req));

  //     if (!usuarioId) {
  //       return res.status(400).json({ success: false, message: 'Usuario inválido' });
  //     }

  //     const { nombre, email, gmail, password, tipo } = req.body;

  //     if (!nombre && !email && !gmail && !password && !tipo) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Al menos un campo (nombre, email, gmail, password o tipo) es requerido',
  //       });
  //     }

  //     const updateData = {
  //       nombre: nombre ?? undefined,
  //       email: email ?? gmail ?? undefined,
  //       password_hash: password ? await this.bcrypt.hash(password) : undefined,
  //       tipo: tipo ?? undefined,
  //     };
  //     if (nombre) updateData.nombre = nombre;
  //     if (email || gmail) updateData.email = email ?? gmail;
  //     if (password) {
  //       const hashedPassword = await this.bcrypt.hash(password);
  //       updateData.password_hash = hashedPassword;
  //     }
  //     if (tipo) updateData.tipo = tipo;

  //     const data = await this.repository.updateUser(usuarioId, updateData);
  //     return res.json({ success: true, data });
  //   } catch (error) {
  //     return res.status(500).json({ success: false, message: 'No se pudo actualizar la cuenta' });
  //   }
  // }
  // async updatePassword(req: Request, res: Response) {
  //   try {
  //     const usuarioId = req.body?.id ?? (await this.resolveUserId(req));

  //     if (!usuarioId) {
  //       return res.status(400).json({ success: false, message: 'Usuario inválido' });
  //     }

  //     const { password } = req.body;

  //     if (!password) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'El campo de contraseña es requerido',
  //       });
  //     }

  //     const hashedPassword = await this.bcrypt.hash(password);
  //     const data = await this.repository.updatePassword(usuarioId, hashedPassword);

  //     return res.json({ success: true, data });
  //   } catch (error) {
  //     return res.status(500).json({
  //       success: false,
  //       message: 'No se pudo actualizar la contraseña',
  //     });
  //   }
  // }
  // async getAllUsers(req: Request, res: Response) {
  //   try {
  //     const currentUser = req.session?.user;
  //     if (!currentUser || String(currentUser.tipo || '').toUpperCase() !== 'ADMIN') {
  //       return res.status(403).json({
  //         success: false,
  //         message: 'Solo el administrador puede ver la lista de usuarios',
  //       });
  //     }

  //     const data = await this.repository.getAllUsers();
  //     return res.json({ success: true, data: data ?? [] });
  //   } catch (error) {
  //     return res.status(500).json({
  //       success: false,
  //       message: 'No se pudieron cargar los usuarios',
  //     });
  //   }
  // }

  // async updateUserRole(req: Request, res: Response) {
  //   try {
  //     const currentUser = req.session?.user;
  //     if (!currentUser || String(currentUser.tipo || '').toUpperCase() !== 'ADMIN') {
  //       return res.status(403).json({
  //         success: false,
  //         message: 'Solo el administrador puede cambiar roles',
  //       });
  //     }

  //     const usuarioId = Number(req.params?.id);
  //     const { tipo } = req.body || {};
  //     const normalizedTipo = String(tipo || '')
  //       .trim()
  //       .toUpperCase();

  //     if (!usuarioId || !['USUARIO', 'CRITICO'].includes(normalizedTipo)) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Rol inválido',
  //       });
  //     }

  //     const data = await this.repository.updateUserRole(usuarioId, normalizedTipo);

  //     if (req.session?.user && Number(req.session.user.id) === usuarioId) {
  //       req.session.user.tipo = normalizedTipo;
  //     }

  //     return res.json({ success: true, data });
  //   } catch (error) {
  //     return res.status(500).json({
  //       success: false,
  //       message: 'No se pudo actualizar el rol del usuario',
  //     });
  //   }
  // }

  // async authCheck(req: Request, res: Response) {
  //   const exists = this.session.sessionExist({ request: req, response: res });
  //   if (exists) {
  //     return res.json({
  //       success: true,
  //       message: 'Usuario autenticado',
  //       user: req.session.user,
  //     });
  //   } else {
  //     return res.status(401).json({
  //       success: false,
  //       message: 'Usuario no autenticado',
  //     });
  //   }
  // }
}

export default new LinkAuth(Session);
