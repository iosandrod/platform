import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import { BaseEntity } from './base.entity'
import { jsonColumn } from './json/jsonColumnFactory'

export enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
  GCS = 'gcs',
  AZURE = 'azure'
}

@Entity('uploads')
export class Upload extends BaseEntity {
  /** 原始文件名，如 `photo.jpg` */
  @Column({ type: 'varchar', nullable: true })
  originalName: string

  /** 存储后的文件名或 key，如 `ab12cd34ef.jpg` */
  @Column({ type: 'varchar', nullable: true })
  fileName: string

  /** 文件扩展名，如 `jpg`, `png` */
  @Column({ type: 'varchar', nullable: true })
  ext: string

  /** 文件大小（字节） */
  @Column({ type: 'bigint', nullable: true })
  size: number

  /** MIME 类型，如 `image/png` */
  @Column({ type: 'varchar', nullable: true })
  mimeType: string

  /** 可访问 URL 或相对路径 */
  @Column({ type: 'varchar', nullable: true })//
  url: string

  /** 上传来源（例如 local, s3 等） */
  @Column({ type: 'varchar', nullable: true })
  provider: StorageProvider

  /** 是否公开可访问 */
  @Column({ type: 'integer', nullable: true })
  isPublic: boolean

  /** 额外元数据，如图片宽高、拍摄时间等 */
  @Column(jsonColumn({ nullable: true }))
  metadata: Record<string, any>
  @Column({ type: 'integer', nullable: true })
  userid: number
} 
