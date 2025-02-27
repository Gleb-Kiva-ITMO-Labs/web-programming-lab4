import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as d3 from 'd3';

interface ShapeData {
  id: number;
  type: 'circle' | 'triangle' | 'square';
  x: number;
  y: number;
  size: number;
  directionX: number;
  directionY: number;
  color: string;
}

@Component({
  selector: 'app-moving-shapes',
  template: ` <div #container class="moving-shapes-container"></div> `,
  styles: `
    .moving-shapes-container {
      width: 100%;
      height: 100%;
    }
  `,
})
export class MovingShapesComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @ViewChild('container', { static: false }) containerDiv!: ElementRef;

  @Input() numCircles: number = 4;
  @Input() numSquares: number = 3;
  @Input() numTriangles: number = 5;
  @Input() shapeSize: number = 450;
  @Input() animationSpeed: number = 1;
  @Input() directionChangeProbability: number = 0.01;

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private shapesData: ShapeData[] = [];
  private animationInterval: any;
  private shapeIdCounter: number = 0;

  ngAfterViewInit(): void {
    this.setupSVG();
    this.initializeShapes();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.svg) {
      if (
        changes['numCircles'] ||
        changes['numSquares'] ||
        changes['numTriangles'] ||
        changes['shapeSize']
      ) {
        this.initializeShapes();
        this.restartAnimation();
      }
    }
  }

  private setupSVG(): void {
    const container = d3.select(this.containerDiv.nativeElement);
    container.select('svg').remove();
    this.svg = container
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
  }

  private initializeShapes(): void {
    if (!this.svg) return;

    this.shapesData = [];
    this.shapeIdCounter = 0;
    const width = this.containerDiv.nativeElement.clientWidth;
    const height = this.containerDiv.nativeElement.clientHeight;

    const createShapes = (
      count: number,
      type: 'circle' | 'triangle' | 'square'
    ) => {
      for (let i = 0; i < count; i++) {
        const size = this.shapeSize;
        let initialX = Math.random() * width;
        let initialY = Math.random() * height;
        let offsetX = size / 2;
        let offsetY = size / 2;

        if (type === 'triangle') {
          offsetX = size / 2;
          offsetY = (Math.sqrt(3) / 2) * size * (2 / 3); // Approx center for triangle
        } else if (type === 'square') {
          offsetX = size / 2;
          offsetY = size / 2;
        } else if (type === 'circle') {
          offsetX = size / 2;
          offsetY = size / 2;
        }

        // Keep initial positions within bounds, considering shape size
        initialX = Math.max(offsetX, Math.min(initialX, width - offsetX));
        initialY = Math.max(offsetY, Math.min(initialY, height - offsetY));

        this.shapesData.push({
          id: this.shapeIdCounter++,
          type: type,
          x: initialX,
          y: initialY,
          size: size,
          directionX: Math.random() > 0.5 ? 1 : -1,
          directionY: Math.random() > 0.5 ? 1 : -1,
          color: 'rgba(101, 125, 212, 0.2)',
        });
      }
    };

    createShapes(this.numCircles, 'circle');
    createShapes(this.numSquares, 'square');
    createShapes(this.numTriangles, 'triangle');

    this.svg
      .selectAll('.shape')
      .data(this.shapesData, (d: any) => d.id)
      .join(
        (enter) => {
          const shapeGroups = enter.append('g').attr('class', 'shape');

          shapeGroups
            .filter((d: any) => d.type === 'circle')
            .append('circle')
            .attr('r', (d: any) => d.size / 2)
            .attr('fill', (d: any) => d.color);

          shapeGroups
            .filter((d: any) => d.type === 'triangle')
            .append('path')
            .attr('fill', (d: any) => d.color)
            .attr('d', (d: any) => this.getTrianglePath(d.x, d.y, d.size));

          shapeGroups
            .filter((d: any) => d.type === 'square')
            .append('rect')
            .attr('width', (d: any) => d.size)
            .attr('height', (d: any) => d.size)
            .attr('fill', (d: any) => d.color)
            .attr('x', (d: any) => -d.size / 2) // Position relative to group center
            .attr('y', (d: any) => -d.size / 2); // Position relative to group center

          return shapeGroups;
        },
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
  }

  private getTrianglePath(x: number, y: number, size: number): string {
    const halfSize = size / 2;
    const height = (Math.sqrt(3) / 2) * size;
    const topPointY = -(2 / 3) * halfSize * Math.sqrt(3);
    const bottomY = (1 / 3) * halfSize * Math.sqrt(3);

    return `M 0 ${topPointY} L ${-halfSize} ${bottomY} L ${halfSize} ${bottomY} Z`;
  }

  private startAnimation(): void {
    if (!this.svg) return;

    this.animationInterval = d3.interval(() => {
      const width = this.containerDiv.nativeElement.clientWidth;
      const height = this.containerDiv.nativeElement.clientHeight;

      this.shapesData.forEach((shape) => {
        shape.x += shape.directionX * this.animationSpeed;
        shape.y += shape.directionY * this.animationSpeed;

        let shapeWidth = shape.size;
        let shapeHeight = shape.size;
        let offsetX = shape.size / 2; // Default offset for circle and square
        let offsetY = shape.size / 2;

        if (shape.type === 'triangle') {
          shapeWidth = shape.size; // Approximate width for triangle bounding
          shapeHeight = (Math.sqrt(3) / 2) * shape.size;
          offsetX = shape.size / 2;
          offsetY = (shapeHeight * (2 / 3)) / 2; // Using half of approx height as offset
        } else if (shape.type === 'circle') {
          offsetX = shape.size / 2;
          offsetY = shape.size / 2;
        } else if (shape.type === 'square') {
          offsetX = shape.size / 2;
          offsetY = shape.size / 2;
        }

        if (shape.x + offsetX > width) {
          shape.x = width - offsetX; // Keep within bounds
          shape.directionX *= -1;
        } else if (shape.x - offsetX < 0) {
          shape.x = offsetX; // Keep within bounds
          shape.directionX *= -1;
        }

        if (shape.y + offsetY > height) {
          shape.y = height - offsetY; // Keep within bounds
          shape.directionY *= -1;
        } else if (shape.y - offsetY < 0) {
          shape.y = offsetY; // Keep within bounds
          shape.directionY *= -1;
        }

        if (Math.random() < this.directionChangeProbability) {
          shape.directionX =
            Math.random() > 0.5 ? shape.directionX * -1 : shape.directionX;
          shape.directionY =
            Math.random() > 0.5 ? shape.directionY * -1 : shape.directionY;
        }
      });

      this.svg!.selectAll('.shape')
        .data(this.shapesData, (d: any) => d.id)
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    }, 20);
  }

  private stopAnimation(): void {
    if (this.animationInterval) {
      this.animationInterval.stop();
      this.animationInterval = null;
    }
  }

  private restartAnimation(): void {
    this.stopAnimation();
    this.startAnimation();
  }
}
