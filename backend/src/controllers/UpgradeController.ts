import { Request, Response } from "express"
import { UpgradeModel } from "../models/UpgradeModel"
import { UserModel } from "../models/UserModel"
import { Pool } from "pg"

export class UpgradeController {
  private upgradeModel: UpgradeModel
  private userModel: UserModel

  constructor(pool: Pool) {
    this.upgradeModel = new UpgradeModel(pool)
    this.userModel = new UserModel(pool)
  }

  async createUpgrade(req: Request, res: Response) {
    const { userId, upgradeType, cost } = req.body
    try {
      // Валидация входных данных
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      if (!upgradeType || typeof upgradeType !== 'string') {
        return res.status(400).json({ error: 'Invalid upgrade type' });
      }
      if (!cost || typeof cost !== 'number' || cost <= 0) {
        return res.status(400).json({ error: 'Invalid cost' });
      }

      // Проверяем баланс пользователя
      const user = await this.userModel.getUserById(userId)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      if (user.coins < cost) {
        return res.status(400).json({ error: 'Insufficient balance' })
      }

      const upgrade = await this.upgradeModel.createUpgrade(userId, upgradeType, cost)
      // Вычитаем стоимость из баланса пользователя
      await this.userModel.updateUserCoins(userId, user.coins - cost)
      res.status(201).json(upgrade)
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" })
    }
  }

  async getUpgrades(req: Request, res: Response) {
    const { userId } = req.params
    try {
      const upgrades = await this.upgradeModel.getUpgradesByUserId(Number(userId))
      res.status(200).json(upgrades)
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" })
    }
  }

  async upgradeLevel(req: Request, res: Response) {
    const { id } = req.params
    try {
      // Получаем текущее улучшение
      const getResult = await this.upgradeModel.getUpgradeById(Number(id))
      if (!getResult) {
        return res.status(404).json({ error: 'Upgrade not found' })
      }

      // Проверяем баланс пользователя
      const user = await this.userModel.getUserById(getResult.user_id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Вычисляем стоимость следующего уровня
      const nextLevelCost = Math.ceil(getResult.cost * Math.pow(1.2, getResult.level))
      if (user.coins < nextLevelCost) {
        return res.status(400).json({ error: 'Insufficient balance for upgrade' })
      }

      const upgrade = await this.upgradeModel.upgradeLevel(Number(id))
      // Вычитаем стоимость из баланса пользователя
      await this.userModel.updateUserCoins(getResult.user_id, user.coins - nextLevelCost)
      res.status(200).json(upgrade)
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
