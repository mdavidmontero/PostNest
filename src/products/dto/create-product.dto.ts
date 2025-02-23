import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @IsString({ message: 'Nombre no valido' })
  name: string;

  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  image: string;

  @IsNotEmpty({ message: 'El Precio del producto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio no valido' })
  price: number;

  @IsNotEmpty({ message: 'La cantidad no puede ir vacia' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Cantidad no valida' })
  inventory: number;

  @IsNotEmpty({ message: 'La Categoriaes obligatoria' })
  @IsInt({ message: 'La categoria no es valido' })
  categoryId: number;
}
