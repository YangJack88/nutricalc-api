CREATE DATABASE IF NOT EXISTS nutricalc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutricalc;

-- 成分表
CREATE TABLE `ingredients` (
  `id` varchar(32) NOT NULL,
  `name_zh` varchar(64) NOT NULL,
  `name_en` varchar(64) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `ingredients` VALUES
('fish-oil','鱼油 EPA/DHA','Fish Oil EPA/DHA',now(),now()),
('silymarin','水飞蓟素','Silymarin',now(),now()),
('proanthocyanidins','原花青素','Proanthocyanidins',now(),now()),
('coenzyme-q10','辅酶 Q10','Coenzyme Q10',now(),now()),
('propolis','蜂胶总黄酮','Propolis Flavonoids',now(),now()),
('glucosamine','氨糖/软骨素','Glucosamine/Chondroitin',now(),now()),
('lactoferrin','乳铁蛋白','Lactoferrin',now(),now()),
('collagen','胶原蛋白','Collagen',now(),now()),
('magnesium','镁','Magnesium',now(),now()),
('vitamin-d','维生素D','Vitamin D',now(),now());

-- 聚合统计表（核心！不存用户数据）
CREATE TABLE `ingredient_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ingredient_id` varchar(32) NOT NULL,
  `region` varchar(16) NOT NULL DEFAULT 'all',
  `form` varchar(16) NOT NULL DEFAULT 'all',
  `sample_count` int DEFAULT 0,
  `median_cost` decimal(10,4) DEFAULT 0.0000,
  `min_cost` decimal(10,4) DEFAULT 0.0000,
  `max_cost` decimal(10,4) DEFAULT 0.0000,
  `total_sum` decimal(12,4) DEFAULT 0.0000,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_uniq` (`ingredient_id`,`region`,`form`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始化统计数据
INSERT INTO `ingredient_stats` (ingredient_id, region, form, sample_count, median_cost, min_cost, max_cost, total_sum)
SELECT id, 'all', 'all', 100, 0.20, 0.10, 0.40, 20.00 FROM ingredients;

-- 匿名日志（无个人信息）
CREATE TABLE `user_operation_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(32),
  `ingredient_id` varchar(32),
  `ip_country` varchar(32),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;