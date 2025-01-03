import { IsNotEmpty, IsString } from 'class-validator';
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({
    message: 'El nombre de la categoria no puede ir vacia',
  })
  name: string;
}
