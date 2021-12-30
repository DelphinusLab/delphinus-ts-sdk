interface IProps {
  address: string
}
export default function Address(props: IProps) {
  const len = props.address.length;
  const addr = props.address.slice(0,6) + "..." + props.address.slice(len-6, len);
  return (
    <span>{addr}</span>
  )
}
