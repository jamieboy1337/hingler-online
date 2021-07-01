export enum BufferTarget {
  ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER,
  UNBOUND
};

export enum DrawMode {
  TRIANGLES,
  LINES,
  POINTS
};

export enum DataType {
  BYTE = 0x1400,
  UNSIGNED_BYTE = 0x1401,
  SHORT = 0x1402,
  UNSIGNED_SHORT = 0x1403,
  INT = 0x1404,
  UNSIGNED_INT = 0x1405,
  FLOAT = 0x1406
}

export interface GLBuffer {
  /**
   * Wrapper for VertexAttribPointer. Binds this buffer as an ARRAY_BUFFER
   *   and reads from its contents.
   * @param location attribute index we wish to bind to.
   * @param components number of components in the desired attribute.
   * @param type type of data stored in attrib.
   * @param normalize whether or not to normalize inputs.
   * @param stride bytes separating entries in buffer.
   * @param offset where to start reading from.
   */
  bindToVertexAttribute(location: number, components: number, type: number, normalize: boolean, stride: number, offset: number) : void;

  // DATAVIEW WRAPPERS
  getInt8(offset: number) : number;
  getUint8(offset: number) : number;
  getInt16(offset: number, littleEndian?: boolean) : number;
  getUint16(offset: number, littleEndian?: boolean) : number;
  getInt32(offset: number, littleEndian?: boolean) : number;
  getUint32(offset: number, littleEndian?: boolean) : number;
  getFloat32(offset: number, littleEndian?: boolean) : number;

  /**
   * Wrapper for DrawElements. Binds this buffer as an ELEMENT_ARRAY_BUFFER
   *   and reads from its contents.
   * @param offset - byte offset at which we wish to start reading indices.
   * @param count - number of indices to read.
   * @param dataType - storage type for indices.
   * @param mode - draw mode. defaults to GL_TRIANGLES.
   */
  drawElements(offset: number, count: number, dataType: DataType, mode?: DrawMode) : void;
}